package model

import (
	"time"

	"gorm.io/gorm"
)

type Admin struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	Password  string    `json:"-"`
	Salt      string    `json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *Admin) TableName() string {
	return "_admin"
}

type Index struct {
	Name    string   `json:"name"`
	Indexes []string `json:"indexes"`
}

type Tables struct {
	Name        string  `json:"name" gorm:"primaryKey"`
	Auth        bool    `json:"auth" gorm:"column:auth"`
	System      bool    `json:"system" gorm:"column:system"`
	Indexes     string  `json:"indexes" gorm:"column:indexes"`
	SystemIndex []Index `json:"index" gorm:"-"`
	// 0 = admin only 1 = user only 2 = public
	// view | list | insert | update | delete
	// default 00000
	Access string `json:"access" gorm:"column:access;default:00000"`
}

func (t *Tables) TableName() string {
	return "_table"
}

type QueryHistory struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Query     string    `json:"query"`
	CreatedAt time.Time `json:"created_at"`
}

func (q *QueryHistory) TableName() string {
	return "_queryHistory"
}

type FunctionStored struct {
	Name     string `json:"name" gorm:"primaryKey"`
	Function string `json:"function" gorm:"column:function"`
}

func (f *FunctionStored) TableName() string {
	return "_function"
}

func Migrate(db *gorm.DB) error {
	err := db.AutoMigrate(&Admin{}, &Tables{}, &QueryHistory{}, &FunctionStored{})
	if err != nil {
		return err
	}

	databases := []Tables{
		{Name: "admin", Auth: true, System: true},
		{Name: "query_history", Auth: false, System: true},
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
	NotNull   int    `json:"notnull"`
	PK        int    `json:"pk"`
	Type      string `json:"type"`
	Reference string `json:"reference,omitempty"`
}
