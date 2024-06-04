package pkg_sqlite

import (
	"log"
	"os"
	"strconv"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func NewSQLiteClient() (*gorm.DB, error) {
	var (
		conn *gorm.DB
		err  error
	)

	conn, err = gorm.Open(sqlite.Open(os.Getenv("DB_PATH")), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
		SkipDefaultTransaction: true,
		CreateBatchSize:        1000,
	})
	if err != nil {
		return conn, err
	}

	db, err := conn.DB()
	if err != nil {
		return conn, err
	}

	if _, found := os.LookupEnv("DB_MAX_OPEN_CONNECTION"); found {
		if maxOpenConnection, err := strconv.Atoi(os.Getenv("DB_MAX_OPEN_CONNECTION")); err == nil {
			db.SetMaxOpenConns(maxOpenConnection)
		}
	}

	if _, found := os.LookupEnv("DB_MAX_IDLE_CONNECTION"); found {
		if maxIdleConnection, err := strconv.Atoi(os.Getenv("DB_MAX_IDLE_CONNECTION")); err == nil {
			db.SetMaxIdleConns(maxIdleConnection)
		}
	}

	if _, found := os.LookupEnv("DB_MAX_LIFETIME"); found {
		if maxLifetime, err := strconv.Atoi(os.Getenv("DB_MAX_LIFETIME")); err == nil {
			db.SetConnMaxLifetime(time.Duration(maxLifetime) * time.Minute)
		}
	}

	if _, found := os.LookupEnv("DB_MAX_IDLE_TIME"); found {
		if maxIdleTime, err := strconv.Atoi(os.Getenv("DB_MAX_IDLE_TIME")); err == nil {
			db.SetConnMaxIdleTime(time.Duration(maxIdleTime) * time.Minute)
		}
	}

	log.Printf("Connected to database: %s\n", os.Getenv("DB_PATH"))
	return conn, nil
}
