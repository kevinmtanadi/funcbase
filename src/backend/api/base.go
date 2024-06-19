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
	}
}

func (api *API) Serve() {
	api.MainAPI()
	api.AdminAPI()
	api.AuthAPI()
	api.FunctionAPI()
}

func (api *API) MainAPI() {
	mainRouter := api.router.Group("")

	mainRouter.GET("/tables", api.Database.FetchAllTables, middleware.RequireAuth())
	mainRouter.POST("/query", api.Database.RunQuery, middleware.RequireAuth())
	mainRouter.GET("/query", api.Database.FetchQueryHistory, middleware.RequireAuth())
	mainRouter.GET("/:table_name/columns", api.Database.FetchTableColumns, middleware.RequireAuth())
	mainRouter.POST("/:table_name/rows", api.Database.FetchRows, middleware.RequireAuth())
	mainRouter.GET("/:table_name/:id", api.Database.FetchDataByID, middleware.RequireAuth())
	mainRouter.POST("/table/create", api.Database.CreateTable, middleware.RequireAuth())
	mainRouter.POST("/:table_name/insert", api.Database.InsertData, middleware.RequireAuth())
	mainRouter.PUT("/:table_name/update", api.Database.UpdateData, middleware.RequireAuth())
	mainRouter.DELETE("/:table_name/rows", api.Database.DeleteData, middleware.RequireAuth())
	mainRouter.DELETE("/:table_name", api.Database.DeleteTable, middleware.RequireAuth())
}

func (api *API) AdminAPI() {
	adminRouter := api.router.Group("/admin")

	adminRouter.POST("/register", api.Admin.Register)
	adminRouter.POST("/login", api.Admin.Login)
	adminRouter.GET("", api.Admin.FetchAdminList)
}

func (api *API) AuthAPI() {
	authRouter := api.router.Group("/auth")

	authRouter.POST("/register/:table_name", api.Auth.Register)
	authRouter.POST("/login/:table_name", api.Auth.Login)
}

func (api *API) FunctionAPI() {
	functionRouter := api.router.Group("/function")

	functionRouter.POST("/run", api.Function.RunFunction)
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
