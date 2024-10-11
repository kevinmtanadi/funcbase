package config

import (
	"encoding/json"
	"fmt"
	"funcbase/constants"
	"os"
	"reflect"
	"sync"
)

type (
	AppName string
	AppURL  string
	APIKey  string

	AllowedOrigins  []string
	AutomatedBackup bool

	CronSchedule string

	DBMaxOpenConnection int
	DBMaxIdleConnection int
	DBMaxLifetime       int

	LogLifetime int
)
type CallbackConfig interface {
	OnUpdate()
}

type Config struct {
	AppName             `json:"app_name"`
	AppURL              `json:"app_url"`
	APIKey              `json:"api_key"`
	AllowedOrigins      `json:"allowed_origins"`
	AutomatedBackup     `json:"automated_backup"`
	CronSchedule        `json:"cron_schedule"`
	DBMaxOpenConnection `json:"db_max_open_connection"`
	DBMaxIdleConnection `json:"db_max_idle_connection"`
	DBMaxLifetime       `json:"db_max_lifetime"`
	LogLifetime         `json:"log_lifetime"`
}

func (c *Config) GetAppName() string {
	return string(c.AppName)
}

func (c *Config) GetAppURL() string {
	return string(c.AppURL)
}

func (c *Config) GetAPIKey() string {
	return string(c.APIKey)
}

func (c *Config) GetAllowedOrigins() []string {
	return c.AllowedOrigins
}

func (c *Config) GetAutomatedBackup() bool {
	return bool(c.AutomatedBackup)
}

func (c *Config) GetCronSchedule() string {
	return string(c.CronSchedule)
}

func (c *Config) GetDBMaxOpenConnection() int {
	return int(c.DBMaxOpenConnection)
}

func (c *Config) GetDBMaxIdleConnection() int {
	return int(c.DBMaxIdleConnection)
}

func (c *Config) GetDBMaxLifetime() int {
	return int(c.DBMaxLifetime)
}

var (
	config *Config
	once sync.Once
)

func GetInstance() *Config {
	once.Do(func() {
		config = &Config{}
		config.Load()
	})

	return config
}

var configPath string = fmt.Sprintf("%s/%s", constants.DATA_PATH, constants.CONFIG_PATH)

func (c *Config) Load() error {
	fileStat, _ := os.Stat(configPath)
	if fileStat.Size() == 0 {
		config := Config{
			AppName: "Funcbase",
			AppURL:  "https://funcbase.com",
			APIKey:  "default-api-key",
			AllowedOrigins: []string{
				"http://localhost:8080",
				"http://localhost:3000",
			},
			AutomatedBackup:     false,
			CronSchedule:        "",
			DBMaxOpenConnection: 10,
			DBMaxIdleConnection: 5,
			DBMaxLifetime:       2,
			LogLifetime:         2,
		}
		config.Save()

		c = &config

		return nil
	}
	file, _ := os.Open(configPath)
	defer file.Close()

	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&c); err != nil {
		return err
	}

	return nil
}

func (c *Config) Save() error {
	file, err := os.Create(configPath)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	if err := encoder.Encode(c); err != nil {
		return err
	}
	return nil
}

func (c *Config) Set(key string, value interface{}) error {
	val := reflect.ValueOf(c).Elem()
	typ := val.Type()

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		tag := field.Tag.Get("json")

		if tag != key {
			continue
		}

		fieldValue := val.Field(i)
		if !fieldValue.CanSet() {
			return fmt.Errorf("cannot set value to field %s", field.Name)
		}

		newValue := reflect.ValueOf(value)
		if newValue.Type().ConvertibleTo(fieldValue.Type()) {
			fieldValue.Set(newValue.Convert(fieldValue.Type()))
		} else if fieldValue.Type().Kind() == reflect.String && newValue.Kind() == reflect.String {
			fieldValue.SetString(newValue.String())
		} else if fieldValue.Type().Kind() == reflect.Int && newValue.Kind() == reflect.Int {
			fieldValue.SetInt(newValue.Int())
		} else if fieldValue.Type().Kind() == reflect.Bool && newValue.Kind() == reflect.Bool {
			fieldValue.SetBool(newValue.Bool())
		} else if fieldValue.Type().Kind() == reflect.Slice && newValue.Kind() == reflect.Slice {
			// Handle slices like AllowedOrigins
			fieldValue.Set(newValue)
		} else {
			return fmt.Errorf("cannot assign value of type %s to field of type %s", newValue.Type(), fieldValue.Type())
		}

		callbackField, ok := fieldValue.Addr().Interface().(CallbackConfig)
		if ok {
			callbackField.OnUpdate()
		}

		return nil
	}

	return fmt.Errorf("no field found with json tag %s", key)
}

func (c *Config) Get(key string) interface{} {
	val := reflect.ValueOf(c).Elem()
	typ := val.Type()

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		tag := field.Tag.Get("json")

		if tag == key {
			return val.Field(i).Interface()
		}
	}
	return nil
}
