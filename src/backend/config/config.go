package config

import (
	"encoding/json"
	"os"
	"sync"
)

type corsOption struct {
	AllowOrigins []string `json:"allow_origins"`
	AllowMethods []string `json:"allow_methods"`
	AllowHeaders []string `json:"allow_headers"`
}

type Config struct {
	AppName string `json:"app_name"`
	AppURL  string `json:"app_url"`

	CorsOption corsOption `json:"cors_options"`
}

var (
	instance *Config
	once     sync.Once
)

func GetInstance() *Config {
	once.Do(func() {
		instance = &Config{}
		instance.Load()
	})

	return instance
}

func (c *Config) Load() error {
	configPath := os.Getenv("CONFIG_PATH")

	file, err := os.Open(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			config := Config{
				AppName: "Fullbase",
				AppURL:  "https://fullbase.com",
				CorsOption: corsOption{
					AllowOrigins: []string{"*"},
					AllowMethods: []string{"*"},
					AllowHeaders: []string{"*"},
				},
			}
			config.Save()

			c = &config
		}

		return err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&c); err != nil {
		return err
	}

	return nil
}

func (c *Config) Save() error {
	configPath := os.Getenv("CONFIG_PATH")

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
