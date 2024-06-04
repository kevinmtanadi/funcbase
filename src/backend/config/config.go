package config

import (
	"log"
	"react-golang/src/backend/constants"
	"reflect"

	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type Config struct {
	// configs
	ExConfig string `key:"ex_config"`

	// db
	db *gorm.DB
}

func NewConfig(ioc di.Container) *Config {
	return &Config{
		db: ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
	}
}

func (c Config) Load() {
	val := reflect.ValueOf(c)
	for i := 0; i < val.NumField(); i++ {
		tag := val.Type().Field(i).Tag.Get("key")

		err := c.db.Table("configs").
			Where("key = ?", tag).
			Select("value").
			Scan(val.Field(i).Interface())
		if err != nil {
			log.Println("Error on loading config with key:[", tag, "]")
		}
	}
}
