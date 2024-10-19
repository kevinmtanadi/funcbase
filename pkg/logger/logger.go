package logger

import (
	"fmt"
	"funcbase/config"
	"funcbase/constants"
	"sync"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var (
	loggerDb *gorm.DB
	once     sync.Once
)

func GetInstance() *gorm.DB {
	once.Do(func() {
		loggerDb = ConnectDB()
	})

	return loggerDb
}

func ConnectDB() *gorm.DB {
	dbPath := fmt.Sprintf("%s/%s", constants.DATA_PATH, constants.LOG_DB_PATH)
	conn, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
		SkipDefaultTransaction: true,
	})
	if err != nil {
		panic(err)
	}

	db, err := conn.DB()
	if err != nil {
		panic(err)
	}

	db.Exec("PRAGMA journal_mode=WAL")
	db.Exec("PRAGMA synchronous=OFF")
	db.Exec("PRAGMA journal_size_limit=4194304")
	db.Exec("PRAGMA cache_size=2048")

	conn.AutoMigrate(&Log{})

	return conn
}

func DeleteOldLog() {
	db := GetInstance()
	configs := config.GetInstance()

	db.Delete(&Log{}, "created_at < ?", time.Now().Add(-time.Hour*time.Duration(configs.LogLifetime)))
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
