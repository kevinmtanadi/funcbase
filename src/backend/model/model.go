package model

import (
	"log"
	"time"

	"gorm.io/gorm"
)

type Admin struct {
	ID        string
	Email     string
	Username  string
	Password  string
	Salt      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

func Migrate(db *gorm.DB) error {
	err := db.AutoMigrate(&Admin{})

	log.Println("Model Migrated!")
	return err
}
