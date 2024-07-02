package service

import (
	"fmt"
	"react-golang/src/backend/constants"
	"react-golang/src/backend/model"

	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type TableService interface {
	Info(tableName string) (model.Tables, error)
	Columns(tableName string, fetchAuthColumn bool) ([]model.Column, error)
	Insert(tableName string, data map[string]interface{}) error
	Update(tableName string, data map[string]interface{}) error
	Delete(tableName string, data map[string]interface{}) error
}

type TableServiceImpl struct {
	service *BaseService
	db      *gorm.DB
}

func NewTableService(ioc di.Container) TableService {
	return &TableServiceImpl{
		service: NewBaseService(ioc),
		db:      ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
	}
}

func (s *TableServiceImpl) Info(tableName string) (model.Tables, error) {
	var table model.Tables
	err := s.db.Model(&model.Tables{}).
		Where("is_system = ?", false).
		Where("name = ?", tableName).
		First(&table).Error
	if err != nil {
		return table, err
	}

	return table, nil
}

func (s *TableServiceImpl) Columns(tableName string, fetchAuthColumn bool) ([]model.Column, error) {
	var result []model.Column
	if err := s.db.Raw(fmt.Sprintf(`
		SELECT 
			info.cid,
			info.name,
			info.'type',
			info.pk,
			info.'notnull',
			info.dflt_value,
			fk.'table' AS reference
		FROM pragma_table_info('%s') AS info
		LEFT JOIN pragma_foreign_key_list('%s') AS fk ON
		info.name = fk.'from'
	`, tableName, tableName)).
		Scan(&result).
		Error; err != nil {
		return result, err
	}

	for i, col := range result {
		if col.Reference != "" {
			result[i].Type = "RELATION"
		}
	}

	table, err := s.Info(tableName)
	if err != nil {
		return result, err
	}

	// If table is user type, prevent displaying authentication fields
	if table.IsAuth {
		var cleanedResult []model.Column
		if fetchAuthColumn {
			for _, row := range result {
				if row.Name != "salt" {
					cleanedResult = append(cleanedResult, row)
				}
			}

			return result, err
		}
		for _, row := range result {
			if row.Name != "password" && row.Name != "salt" {
				cleanedResult = append(cleanedResult, row)
			}
		}
	}

	return result, err
}

func (s *TableServiceImpl) Insert(tableName string, data map[string]interface{}) error {
	err := s.db.Table(tableName).
		Create(&data).Error

	return err
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
