package api

import (
	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type API struct {
	app      *echo.Echo
	router   *echo.Group
	Admin    AdminAPI
	Auth     AuthAPI
	Backup   BackupAPI
	Database DatabaseAPI
	Function FunctionAPI
	Setting  SettingAPI
	Storage  StorageAPI
}

type Search struct {
	Search string `json:"search" query:"search"`
}

func NewAPI(app *echo.Echo, ioc di.Container) *API {
	return &API{
		app:      app,
		router:   app.Group("/api"),
		Admin:    NewAdminAPI(ioc),
		Auth:     NewAuthAPI(ioc),
		Backup:   NewBackupAPI(ioc),
		Database: NewDatabaseAPI(ioc),
		Function: NewFunctionAPI(ioc),
		Setting:  NewSettingAPI(ioc),
		Storage:  NewStorageAPI(ioc),
	}
}

func (api *API) Serve() {
	api.MainAPI()
	api.AdminAPI()
	api.AuthAPI()
	api.SettingAPI()
	api.StorageAPI()
	api.BackupAPI()
	api.FunctionAPI()
}
