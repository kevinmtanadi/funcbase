package model

import (
	"log"

	"gorm.io/gorm"
)

type Functions struct {
	Name string `json:"name" gorm:"primaryKey"`
	Data string `json:"data"`
}

func (*Functions) TableName() string {
	return "functions"
}

type InputTypes struct {
	Name string `json:"name" gorm:"primaryKey"`
	Data string `json:"data"`
}

func (*InputTypes) TableName() string {
	return "input_types"
}

func Migrate(db *gorm.DB) error {
	err := db.AutoMigrate(&Functions{}, &InputTypes{})

	log.Println("Model Migrated!")
	return err
}
