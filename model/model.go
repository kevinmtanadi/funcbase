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

type Tables struct {
	Name     string `json:"name" gorm:"primaryKey"`
	IsAuth   bool   `json:"is_auth" gorm:"column:is_auth"`
	IsSystem bool   `json:"is_system" gorm:"column:is_system"`
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
	NotNull   int    `json:"notnull"`
	PK        int    `json:"pk"`
	Type      string `json:"type"`
	Reference string `json:"reference,omitempty"`
}

type Log struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Method     string    `json:"method"`
	Endpoint   string    `json:"endpoint"`
	CallerIP   string    `json:"caller_ip"`
	StatusCode int       `json:"status"`
	ExecTime   float32   `json:"exec_time"`
	CreatedAt  time.Time `json:"created_at"`
	UserAgent  string    `json:"user_agent"`
}

func (l *Log) TableName() string {
	return "_log"
}
