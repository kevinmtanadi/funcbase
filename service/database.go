package service

import (
	"fmt"
	"funcbase/constants"
	"strings"

	"github.com/patrickmn/go-cache"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FetchOption struct {
	Table  string
	Filter string
	Order  string
	Limit  int
	Offset int
}

type DBService interface {
	Fetch(db *gorm.DB, option *FetchOption) ([]map[string]interface{}, error)
	Count(db *gorm.DB, option *FetchOption) (int64, error)
	Insert(db *gorm.DB, tableName string, data map[string]interface{}) error
	Update(db *gorm.DB, tableName string, data map[string]interface{}) error
	Delete(db *gorm.DB, tableName string, data map[string]interface{}) error
	BatchDelete(db *gorm.DB, tableName string, data []string) error
}

type DBServiceImpl struct {
	cache   *cache.Cache
	service *BaseService
}

func NewDBService(ioc di.Container) DBService {
	return &DBServiceImpl{
		cache:   ioc.Get(constants.CONTAINER_CACHE).(*cache.Cache),
		service: NewBaseService(ioc),
	}
}

func (s *DBServiceImpl) Fetch(db *gorm.DB, option *FetchOption) ([]map[string]interface{}, error) {
	tableName := option.Table

	table, err := s.service.WithService().Table.Info(tableName)
	if err != nil {
		return nil, err
	}

	query := db.Table(tableName)

	columns := "*"
	if table.IsAuth {
		columnsArr, err := s.service.WithService().Table.Columns(tableName, false)

		if err != nil {
			return nil, err
		}

		columns = ""

		for _, column := range columnsArr {
			col := column["name"].(*interface{})
			if *col == "password" || *col == "salt" {
				continue
			}

			if columns != "" {
				columns = fmt.Sprintf("%s, %s", columns, *col)
				continue
			}
			columns = fmt.Sprintf("%s", *col)
		}
	}

	query = query.Select(columns)

	if option.Filter != "" {
		// convert the $user.id to userID on api package
		if isSQLTerm(option.Filter) {
			query = query.Where(option.Filter)
		} else {
			columns, err := s.service.WithService().Table.Columns(tableName, false)
			if err != nil {
				return nil, err
			}

			for i, column := range columns {
				cName := column["name"].(*interface{})
				if i == 0 {
					query = query.Where(fmt.Sprintf("%s LIKE ('%%%s%%')", *cName, option.Filter))
				} else {
					query = query.Or(fmt.Sprintf("%s LIKE ('%%%s%%')", *cName, option.Filter))
				}
			}
		}
	}

	if option.Order != "" {
		query = query.Order(option.Order)
	}

	if option.Limit > 0 {
		query = query.Limit(option.Limit)
	}

	if option.Offset > 0 {
		query = query.Offset(option.Offset)
	}

	var data []map[string]interface{}
	err = query.Find(&data).Error

	return data, err
}

func (s *DBServiceImpl) Count(db *gorm.DB, option *FetchOption) (int64, error) {
	tableName := option.Table
	cacheKey := "count_" + tableName
	if storedCache, ok := s.cache.Get(cacheKey); ok {
		return storedCache.(int64), nil
	}

	query := db.Table(tableName)
	var count int64
	if option.Filter != "" {
		// convert the $user.id to userID on api package
		if isSQLTerm(option.Filter) {
			query = query.Where(option.Filter)
		} else {
			columns, err := s.service.WithService().Table.Columns(tableName, false)
			if err != nil {
				return 0, err
			}

			for i, column := range columns {
				cName := column["name"].(*interface{})
				if i == 0 {
					query = query.Where(fmt.Sprintf("%s LIKE ('%%%s%%')", *cName, option.Filter))
				} else {
					query = query.Or(fmt.Sprintf("%s LIKE ('%%%s%%')", *cName, option.Filter))
				}
			}
		}
	}

	err := query.Count(&count).Error

	s.cache.Set(cacheKey, count, cache.DefaultExpiration)

	return count, err
}

var sqlTerms = []string{"LIKE", "=", ">=", "<=", ">", "<", "!=", "AND", "OR", "NOT"}

func isSQLTerm(term string) bool {
	if strings.Contains(term, "(") || strings.Contains(term, ")") {
		return true
	}

	for _, sqlTerm := range sqlTerms {
		if strings.Contains(term, sqlTerm) {
			return true
		}
	}
	return false
}

func (s *DBServiceImpl) Insert(db *gorm.DB, tableName string, data map[string]interface{}) error {
	err := db.Table(tableName).Clauses(
		clause.Returning{Columns: []clause.Column{{Name: "id"}}},
	).Create(&data).Error

	return err
}

func (s *DBServiceImpl) Update(db *gorm.DB, tableName string, data map[string]interface{}) error {
	err := db.Table(tableName).
		Where("id = ?", data["id"]).
		Updates(&data).Error

	return err
}

func (s *DBServiceImpl) Delete(db *gorm.DB, tableName string, data map[string]interface{}) error {
	err := db.Table(tableName).
		Where("id = ?", data["id"]).
		Delete(&data).Error

	return err
}

func (s *DBServiceImpl) BatchDelete(db *gorm.DB, tableName string, data []string) error {
	err := db.Table(tableName).
		Where("id IN ?", data).
		Delete(&data).Error

	return err
}
