package service

import (
	"fmt"
	"funcbase/constants"
	"funcbase/model"

	"github.com/patrickmn/go-cache"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type TableService interface {
	Info(tableName string) (model.Tables, error)
	Columns(tableName string, fetchAuthColumn bool) ([]map[string]interface{}, error)
	Insert(tableName string, data map[string]interface{}) (interface{}, error)
	Update(tableName string, data map[string]interface{}) error
	Delete(tableName string, data map[string]interface{}) error
	BatchDelete(tableName string, data []string) error
}

type TableServiceImpl struct {
	service *BaseService
	db      *gorm.DB
	cache   *cache.Cache
}

func NewTableService(ioc di.Container) TableService {
	return &TableServiceImpl{
		service: NewBaseService(ioc),
		db:      ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
		cache:   ioc.Get(constants.CONTAINER_CACHE).(*cache.Cache),
	}
}

func (s *TableServiceImpl) Info(tableName string) (model.Tables, error) {
	cacheKey := "table_" + tableName
	if storedCache, ok := s.cache.Get(cacheKey); ok {
		return storedCache.(model.Tables), nil
	}

	var table model.Tables
	err := s.db.Model(&model.Tables{}).
		Where("is_system = ?", false).
		Where("name = ?", tableName).
		First(&table).Error
	if err != nil {
		return table, err
	}

	s.cache.Set(cacheKey, table, cache.DefaultExpiration)

	return table, nil
}

func (s *TableServiceImpl) Columns(tableName string, fetchAuthColumn bool) ([]map[string]interface{}, error) {
	var result []map[string]interface{}
	cacheKey := "columns_" + tableName
	storedCache, ok := s.cache.Get(cacheKey)
	if ok {
		return storedCache.([]map[string]interface{}), nil
	}

	rows, err := s.db.Raw(fmt.Sprintf(`
		SELECT 
			CAST(info.cid AS INT) AS cid,
			info.name,
			info.'type',
			info.pk,
			info.'notnull',
			info.dflt_value,
			fk.'table' AS reference
		FROM pragma_table_info('%s') AS info
		LEFT JOIN pragma_foreign_key_list('%s') AS fk ON
		info.name = fk.'from'
	`, tableName, tableName)).Rows()
	if err != nil {
		return result, err
	}

	defer rows.Close()
	for rows.Next() {
		var row map[string]interface{}
		if err := s.db.ScanRows(rows, &row); err != nil {
			return result, err
		}
		result = append(result, row)
	}

	for i, col := range result {
		if col["reference"] != nil {
			result[i]["type"] = "RELATION"
		}
	}

	table, err := s.Info(tableName)
	if err != nil {
		return nil, err
	}

	// If table is user type, prevent displaying authentication fields
	if table.IsAuth {
		var cleanedResult []map[string]interface{}
		if fetchAuthColumn {
			for _, row := range result {
				if row["name"] != "salt" {
					cleanedResult = append(cleanedResult, row)
				}
			}

			return cleanedResult, nil
		}

		for _, row := range result {
			if row["name"] != "password" && row["name"] != "salt" {
				cleanedResult = append(cleanedResult, row)
			}
		}

		return cleanedResult, nil
	}

	s.cache.Set(cacheKey, result, cache.DefaultExpiration)

	return result, err
}

func (s *TableServiceImpl) Insert(tableName string, data map[string]interface{}) (interface{}, error) {
	err := s.db.Table(tableName).
		Create(&data).Error

	return data["id"], err
}

func (s *TableServiceImpl) Update(tableName string, data map[string]interface{}) error {
	err := s.db.Table(tableName).
		Where("id = ?", data["id"]).
		Updates(&data).Error

	return err
}

func (s *TableServiceImpl) Delete(tableName string, data map[string]interface{}) error {
	err := s.db.Table(tableName).
		Where("id = ?", data["id"]).
		Delete(&data).Error

	return err
}

func (s *TableServiceImpl) BatchDelete(tableName string, data []string) error {
	err := s.db.Table(tableName).
		Where("id IN ?", data).
		Delete(&data).Error

	return err
}
