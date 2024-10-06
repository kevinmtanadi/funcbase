package pkg_sqlite

import (
	"funcbase/constants"
	"funcbase/model"
	"log"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

type SQLiteOption struct {
	DryRun  bool
	Migrate bool
}

func NewSQLiteClient(dbPath string, options ...SQLiteOption) (*gorm.DB, error) {
	var (
		conn *gorm.DB
		err  error
	)

	option := SQLiteOption{
		DryRun:  false,
		Migrate: false,
	}
	if len(options) > 0 {
		option = options[0]
	}

	conn, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
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

	db.SetMaxOpenConns(constants.DB_MAX_OPEN_CONNECTION)
	db.SetMaxIdleConns(constants.DB_MAX_IDLE_CONNECTION)
	db.SetConnMaxLifetime(constants.DB_MAX_LIFETIME)
	db.SetConnMaxIdleTime(constants.DB_MAX_IDLE_TIME)

	if option.Migrate {
		model.Migrate(conn)
	}

	log.Printf("Connected to database: %s\n", os.Getenv("DB_PATH"))
	return conn, nil
}
