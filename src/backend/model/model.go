package model

import (
	"log"

	"gorm.io/gorm"
)

type Function struct {
	Name string `json:"name" gorm:"primaryKey"`
	Data string `json:"data"`
	Type string `json:"type" gorm:"default:single"`
}

func (*Function) TableName() string {
	return "functions"
}

type InputType struct {
	Name string `json:"name" gorm:"primaryKey"`
	Data string `json:"data"`
}

func (*InputType) TableName() string {
	return "input_types"
}

func Migrate(db *gorm.DB) error {
	err := db.AutoMigrate(&Function{}, &InputType{})

	log.Println("Model Migrated!")
	return err
}
