package service

import (
	"encoding/json"
	"fmt"
	"funcbase/constants"
	"funcbase/model"
	"strings"

	"github.com/patrickmn/go-cache"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type TableService interface {
	Info(tableName string, params ...InfoParams) (model.Tables, error)
	Columns(tableName string, fetchAuthColumn bool) ([]map[string]interface{}, error)
}

type TableServiceImpl struct {
	service *BaseService
	db      *gorm.DB
	cache   *cache.Cache
}

func NewTableService(ioc di.Container) TableService {
	return &TableServiceImpl{
		service: NewBaseService(ioc),
		db:      ioc.Get(constants.CONTAINER_DB).(*gorm.DB),
		cache:   ioc.Get(constants.CONTAINER_CACHE).(*cache.Cache),
	}
}

type InfoParams struct {
	Columns []string
}

func (s *TableServiceImpl) Info(tableName string, params ...InfoParams) (model.Tables, error) {

	param := InfoParams{Columns: []string{"name", "auth", "system"}}
	if len(params) > 0 {
		param = params[0]
	}

	cacheKey := "table_" + strings.Join(param.Columns, ";") + tableName
	if storedCache, ok := s.cache.Get(cacheKey); ok {
		return storedCache.(model.Tables), nil
	}

	var table model.Tables
	err := s.db.Model(&model.Tables{}).
		Select(param.Columns).
		Where("system = ?", false).
		Where("name = ?", tableName).
		First(&table).Error
	if err != nil {
		return table, err
	}

	for _, col := range param.Columns {
		if col == "indexes" {
			index := []model.Index{}

			fmt.Println(table.Indexes)
			err = json.Unmarshal([]byte(table.Indexes), &index)
			if err != nil {
				return table, err
			}

			table.SystemIndex = index
		}
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
	if table.Auth {
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
