package pkg_sqlite

import (
	"funcbase/config"
	"funcbase/model"
	"log"
	"os"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

type SQLiteOption struct {
	DryRun   bool
	Migrate  bool
	LogMode  logger.LogLevel
	Optimize bool
}

var (
	conn *gorm.DB
	err  error
)

func NewSQLiteClient(dbPath string, options ...SQLiteOption) (*gorm.DB, error) {

	option := SQLiteOption{
		DryRun:   false,
		Migrate:  false,
		LogMode:  logger.Silent,
		Optimize: false,
	}
	if len(options) > 0 {
		option = options[0]
	}

	conn, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(option.LogMode),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
		SkipDefaultTransaction: true,
		CreateBatchSize:        1000,
		DryRun:                 option.DryRun,
	})
	if err != nil {
		return conn, err
	}

	db, err := conn.DB()
	if err != nil {
		return conn, err
	}

	db.Exec("PRAGMA journal_mode=WAL")
	db.Exec("PRAGMA synchronous=NORMAL")
	db.Exec("PRAGMA journal_size_limit=16777216")
	db.Exec("PRAGMA cache_size=10000")

	if option.Optimize {
		configs := config.GetInstance()
		db.SetMaxOpenConns(int(configs.DBMaxOpenConnection))
		db.SetMaxIdleConns(int(configs.DBMaxIdleConnection))
		db.SetConnMaxLifetime(time.Duration(configs.DBMaxLifetime) * time.Minute)
	}

	config.SetDBConfigCallback(SetDBConfig)

	if option.Migrate {
		model.Migrate(conn)
	}

	log.Printf("Connected to database: %s\n", os.Getenv("DB_PATH"))
	return conn, nil
}

func SetDBConfig() {
	configs := config.GetInstance()

	db, err := conn.DB()
	if err != nil {
		return
	}

	db.SetMaxOpenConns(int(configs.DBMaxOpenConnection))
	db.SetMaxIdleConns(int(configs.DBMaxIdleConnection))
	db.SetConnMaxLifetime(time.Duration(configs.DBMaxLifetime) * time.Minute)
}
