package api

import (
	"react-golang/src/backend/middleware"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type API struct {
	app      *echo.Echo
	router   *echo.Group
	Admin    AdminAPI
	Auth     AuthAPI
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

	api.router.POST("/:func_name", api.Function.RunFunction, middleware.RequireAuth(false), middleware.ValidateAPIKey)
	api.router.GET("/function", api.Function.FetchFunctionList, middleware.ValidateMainAPIKey)
	api.router.GET("/function/:func_name", api.Function.FetchFunctionDetail, middleware.ValidateMainAPIKey)
	api.router.DELETE("/function/:func_name", api.Function.DeleteFunction, middleware.ValidateMainAPIKey)
	api.router.POST("/function/create", api.Function.CreateFunction, middleware.ValidateMainAPIKey)
}

func (api *API) MainAPI() {
	mainRouter := api.router.Group("/main", middleware.RequireAuth(true), middleware.ValidateMainAPIKey)

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
	adminRouter := api.router.Group("/admin", middleware.ValidateMainAPIKey)

	adminRouter.POST("/register", api.Admin.Register)
	adminRouter.POST("/login", api.Admin.Login)
	adminRouter.GET("", api.Admin.FetchAdminList)
}

func (api *API) AuthAPI() {
	authRouter := api.router.Group("/auth", middleware.ValidateAPIKey)

	authRouter.POST("/register/:table_name", api.Auth.Register)
	authRouter.POST("/login/:table_name", api.Auth.Login)
}

func (api *API) SettingAPI() {
	settingRouter := api.router.Group("/settings", middleware.ValidateMainAPIKey)

	settingRouter.GET("", api.Setting.Get)
	settingRouter.PUT("", api.Setting.Update)
}

func (api *API) StorageAPI() {
	storageRouter := api.router.Group("/storage")

	storageRouter.GET("", api.Storage.FetchStorageData, middleware.ValidateMainAPIKey)
	storageRouter.GET("/:filename", api.Storage.Retrieve)
	storageRouter.POST("/upload", api.Storage.Upload, middleware.ValidateAPIKey)
	storageRouter.DELETE("/:filename", api.Storage.Delete, middleware.ValidateMainAPIKey)
}
