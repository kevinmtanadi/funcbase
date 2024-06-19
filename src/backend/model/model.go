package model

import (
	"time"

	"gorm.io/gorm"
)

type Admin struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	Password  string    `json:"-"`
	Salt      string    `json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Tables struct {
	Name     string `json:"name" gorm:"primaryKey,column:name"`
	IsAuth   bool   `json:"is_auth" gorm:"column:is_auth"`
	IsSystem bool   `json:"is_system" gorm:"column:is_system"`
}

type QueryHistory struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Query     string    `json:"query"`
	CreatedAt time.Time `json:"created_at"`
}

func Migrate(db *gorm.DB) error {
	err := db.AutoMigrate(&Admin{}, &Tables{}, &QueryHistory{})
	if err != nil {
		return err
	}

	databases := []Tables{
		{Name: "admin", IsAuth: true, IsSystem: true},
		{Name: "query_history", IsAuth: false, IsSystem: true},
	}
	err = db.Model(&Tables{}).Create(databases).Error
	if err != nil {
		return err
	}

	return err
}

// OTHERS MODELS

type Column struct {
	CID       int    `json:"cid"`
	Default   string `json:"dflt_value"`
	Name      string `json:"name"`
	NotNull   bool   `json:"notnull"`
	PK        int    `json:"pk"`
	Type      string `json:"type"`
	Reference string `json:"reference,omitempty"`
}
