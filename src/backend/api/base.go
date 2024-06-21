package api

import (
	api_function "react-golang/src/backend/api/functions"
	"react-golang/src/backend/middleware"
	"react-golang/src/backend/model"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type API struct {
	app      *echo.Echo
	router   *echo.Group
	Admin    AdminAPI
	Auth     AuthAPI
	Database DatabaseAPI
	Function api_function.FunctionAPI
	Setting  SettingAPI
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
		Database: NewDatabaseAPI(ioc),
		Function: api_function.NewFunctionAPI(ioc),
		Setting:  NewSettingAPI(ioc),
	}
}

func (api *API) Serve() {
	api.MainAPI()
	api.AdminAPI()
	api.AuthAPI()
	api.FunctionAPI()
	api.SettingAPI()
}

func (api *API) MainAPI() {
	mainRouter := api.router.Group("", middleware.RequireAuth(true), middleware.ValidateAPIKey)

	mainRouter.GET("/tables", api.Database.FetchAllTables)
	mainRouter.POST("/query", api.Database.RunQuery)
	mainRouter.GET("/query", api.Database.FetchQueryHistory)
	mainRouter.GET("/:table_name/columns", api.Database.FetchTableColumns)
	mainRouter.POST("/:table_name/rows", api.Database.FetchRows)
	mainRouter.GET("/:table_name/:id", api.Database.FetchDataByID)
	mainRouter.POST("/table/create", api.Database.CreateTable)
	mainRouter.POST("/:table_name/insert", api.Database.InsertData)
	mainRouter.PUT("/:table_name/update", api.Database.UpdateData)
	mainRouter.DELETE("/:table_name/rows", api.Database.DeleteData)
	mainRouter.DELETE("/:table_name", api.Database.DeleteTable)
}

func (api *API) AdminAPI() {
	adminRouter := api.router.Group("/admin", middleware.ValidateAPIKey)

	adminRouter.POST("/register", api.Admin.Register)
	adminRouter.POST("/login", api.Admin.Login)
	adminRouter.GET("", api.Admin.FetchAdminList)
}

func (api *API) AuthAPI() {
	authRouter := api.router.Group("/auth", middleware.ValidateAPIKey)

	authRouter.POST("/register/:table_name", api.Auth.Register)
	authRouter.POST("/login/:table_name", api.Auth.Login)
}

func (api *API) FunctionAPI() {
	functionRouter := api.router.Group("/function", middleware.ValidateAPIKey)

	functionRouter.POST("/run", api.Function.RunFunction, middleware.RequireAuth(false))
}

func (api *API) SettingAPI() {
	settingRouter := api.router.Group("/settings", middleware.ValidateAPIKey)

	settingRouter.GET("", api.Setting.Get)
	settingRouter.PUT("", api.Setting.Update)
}

func getTableInfo(db *gorm.DB, tableName string) (model.Tables, error) {
	var table model.Tables
	err := db.Model(&model.Tables{}).
		Where("is_system = ?", false).
		Where("name = ?", tableName).
		First(&table).Error
	if err != nil {
		return table, err
	}

	return table, nil
}
