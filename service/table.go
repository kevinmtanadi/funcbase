package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"funcbase/constants"
	"funcbase/model"
	"funcbase/utils"
	"strings"

	"github.com/patrickmn/go-cache"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type TableService interface {
	Info(tableName string, infoNeeded ...string) (model.Tables, error)
	Create(tx *gorm.DB, params model.CreateTable) error
	Rename(tx *gorm.DB, tableName string, newName string) error
	Drop(tx *gorm.DB, tableName string) error

	Columns(tableName string, fetchAuthColumn bool, fetchTableType bool) ([]map[string]interface{}, error)

	Indexes(tableName string) ([]string, error)
	DropIndexes(tx *gorm.DB, indexes []string) error
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

const TABLE_INFO_COLUMNS = "columns"
const TABLE_INFO_NAME = "name"
const TABLE_INFO_AUTH = "auth"
const TABLE_INFO_SYSTEM = "system"
const TABLE_INFO_INDEXES = "indexes"
const TABLE_INFO_ACCESS = "access"

func (s *TableServiceImpl) Info(tableName string, infoNeeded ...string) (model.Tables, error) {
	if len(infoNeeded) == 0 {
		infoNeeded = []string{TABLE_INFO_NAME, TABLE_INFO_AUTH, TABLE_INFO_INDEXES, TABLE_INFO_SYSTEM, TABLE_INFO_ACCESS}
	}

	var tableInfo model.Tables
	unfoundData := []string{}
	for _, info := range infoNeeded {
		cacheKey := "tableInfo:" + tableName + ":" + info

		if storedCache, ok := s.cache.Get(cacheKey); ok {
			// Handle each field individually
			switch info {
			case TABLE_INFO_NAME:
				if cachedName, ok := storedCache.(string); ok {
					tableInfo.Name = cachedName
				}
			case TABLE_INFO_AUTH:
				if cachedAuth, ok := storedCache.(bool); ok {
					tableInfo.Auth = cachedAuth
				}
			case TABLE_INFO_SYSTEM:
				if cachedSystem, ok := storedCache.(bool); ok {
					tableInfo.System = cachedSystem
				}
			case TABLE_INFO_INDEXES:
				if cachedIndexes, ok := storedCache.(string); ok {
					tableInfo.Indexes = cachedIndexes
				}
			case TABLE_INFO_ACCESS:
				if cachedAccess, ok := storedCache.(model.Access); ok {
					tableInfo.Access = cachedAccess
				}
			}
		} else {
			unfoundData = append(unfoundData, info)
		}
	}

	err := s.db.Model(&model.Tables{}).
		Select(unfoundData).
		Where("name = ?", tableName).
		First(&tableInfo).Error
	if err != nil {
		return tableInfo, err
	}

	if utils.ArrayContains[string](infoNeeded, TABLE_INFO_INDEXES) {
		index := []model.Index{}

		err = json.Unmarshal([]byte(tableInfo.Indexes), &index)
		if err != nil {
			return tableInfo, err
		}

		tableInfo.SystemIndex = index
	}

	for _, info := range unfoundData {
		cacheKey := "tableInfo:" + tableName + ":" + info
		switch info {
		case TABLE_INFO_NAME:
			s.cache.Set(cacheKey, tableInfo.Name, cache.DefaultExpiration)
		case TABLE_INFO_AUTH:
			s.cache.Set(cacheKey, tableInfo.Auth, cache.DefaultExpiration)
		case TABLE_INFO_SYSTEM:
			s.cache.Set(cacheKey, tableInfo.System, cache.DefaultExpiration)
		case TABLE_INFO_INDEXES:
			s.cache.Set(cacheKey, tableInfo.Indexes, cache.DefaultExpiration)
		case TABLE_INFO_ACCESS:
			s.cache.Set(cacheKey, tableInfo.Access, cache.DefaultExpiration)
		}

	}

	return tableInfo, nil
}

func (s *TableServiceImpl) Create(tx *gorm.DB, params model.CreateTable) error {
	fields := []string{
		"id INTEGER PRIMARY KEY",
	}

	isAuth := false
	if params.Type == "users" {
		authFields := []string{
			"email TEXT NOT NULL",
			"password TEXT NOT NULL",
			"salt TEXT NOT NULL",
		}
		isAuth = true

		fields = append(fields, authFields...)
	}

	foreignKeys := []string{}
	uniques := []string{}

	for i := 0; i < len(params.Fields); i++ {
		dtype := params.Fields[i].ConvertTypeToSQLiteType()
		// IGNORE UNSUPPORTED DATATYPES FOR NOW
		if dtype == "" {
			continue
		}

		var field string
		if dtype == "RELATION" {
			field = fmt.Sprintf("%s %s", params.Fields[i].Name, "REAL")
			foreignKeys = append(foreignKeys, fmt.Sprintf("FOREIGN KEY(%s) REFERENCES %s(id) ON UPDATE CASCADE", params.Fields[i].Name, params.Fields[i].Reference))
		} else {
			field = fmt.Sprintf("%s %s", params.Fields[i].Name, dtype)
		}

		if !params.Fields[i].Nullable {
			field += " NOT NULL"
		}

		if params.Fields[i].Unique {
			uniques = append(uniques, fmt.Sprintf("UNIQUE (%s)", params.Fields[i].Name))
		}

		fields = append(fields, field)
	}

	fields = append(fields, []string{
		"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
	}...)

	fields = append(append(fields, uniques...), foreignKeys...)

	query := `
		CREATE TABLE %s (
			%s
		)
	`

	query = fmt.Sprintf(query, params.Name, strings.Join(fields, ","))
	fmt.Println(query)

	err := tx.Exec(query).Error
	if err != nil {
		return err
	}

	// add index
	for _, index := range params.Indexes {
		err = tx.Exec(fmt.Sprintf("CREATE INDEX %s ON %s (%s)", index.Name, params.Name, strings.Join(index.Indexes, ","))).Error
		if err != nil {
			return err
		}
	}

	// check if trigger already exist
	var triggerHolder int64
	err = tx.Table("sqlite_master").
		Select("*").
		Where("type = ?", "trigger").
		Where("name = ?", fmt.Sprintf("updated_timestamp_%s", params.Name)).
		Count(&triggerHolder).Error
	if err != nil {
		return err
	}

	// add trigger to update updated_at value on update
	if triggerHolder == 0 {
		err = tx.Exec(fmt.Sprintf(`
			CREATE TRIGGER updated_timestamp_%s
			AFTER UPDATE ON %s
			FOR EACH ROW
			BEGIN
				UPDATE %s SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
			END
			`, params.Name, params.Name, params.Name)).Error
		if err != nil {
			return err
		}
	}

	indexJson, err := json.Marshal(params.Indexes)
	if err != nil {
		return err
	}

	err = tx.Create(
		&model.Tables{
			Name:    params.Name,
			Auth:    isAuth,
			System:  false,
			Indexes: string(indexJson),
			Access:  "0;0;0;0;0",
		}).
		Error
	if err != nil {
		return err
	}

	return nil

}

func (s *TableServiceImpl) Rename(tx *gorm.DB, tableName string, newTableName string) error {
	err := tx.Model(&model.Tables{}).Where("name = ?", tableName).Update("name", newTableName).Error
	if err != nil {
		return err
	}

	return tx.Exec(fmt.Sprintf("ALTER TABLE %s RENAME TO %s", tableName, newTableName)).Error
}

func (s *TableServiceImpl) Drop(tx *gorm.DB, tableName string) error {
	err := tx.Model(&model.Tables{}).Where("name = ?", tableName).Delete(&model.Tables{}).Error
	if err != nil {
		return err
	}

	return tx.Exec(fmt.Sprintf("DROP TABLE %s", tableName)).Error
}

func (s *TableServiceImpl) Columns(tableName string, fetchAuthColumn bool, fetchTableType bool) ([]map[string]interface{}, error) {
	var result []map[string]interface{}
	cacheKey := "columns_" + tableName
	storedCache, ok := s.cache.Get(cacheKey)
	if ok {
		return storedCache.([]map[string]interface{}), nil
	}

	string1 := ""
	string2 := ""
	if fetchTableType {
		string1 = ", t.auth"
		string2 = "LEFT JOIN '_table' AS t ON fk.'table' = t.name"
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
			%s
		FROM pragma_table_info('%s') AS info
		LEFT JOIN pragma_foreign_key_list('%s') AS fk ON
		info.name = fk.'from' %s
	`, string1, tableName, tableName, string2)).Rows()
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

	table, err := s.Info(tableName, TABLE_INFO_AUTH)
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

func (s *TableServiceImpl) Indexes(tableName string) ([]string, error) {
	var indexes []struct {
		Name string
	}

	err := s.db.Table("sqlite_master").
		Where("type = ?", "index").
		Where("tbl_name = ?", tableName).
		Find(&indexes).Error

	idxs := []string{}
	for _, index := range indexes {
		idxs = append(idxs, index.Name)
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return idxs, nil
	}

	return idxs, err
}

func (s *TableServiceImpl) DropIndexes(tx *gorm.DB, indexes []string) error {
	for _, index := range indexes {
		err := tx.Exec(fmt.Sprintf("DROP INDEX IF EXISTS %s", index)).Error
		if err != nil {
			return err
		}
	}

	return nil
}
