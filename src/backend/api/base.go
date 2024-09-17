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
	Logs     LogsAPI
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
		Logs:     NewLogsAPI(ioc),
	}
}

func (api *API) Serve() {
	api.MainAPI()
	api.AdminAPI()
	api.AuthAPI()
	api.SettingAPI()
	api.StorageAPI()
	api.LogsAPI()

	api.router.POST("/:func_name", api.Function.RunFunction, middleware.RequireAuth(false), middleware.ValidateAPIKey)
	api.router.GET("/function", api.Function.FetchFunctionList, middleware.ValidateMainAPIKey)
	api.router.GET("/function/:func_name", api.Function.FetchFunctionDetail, middleware.ValidateMainAPIKey)
	api.router.DELETE("/function/:func_name", api.Function.DeleteFunction, middleware.ValidateMainAPIKey)
	api.router.POST("/function/create", api.Function.CreateFunction, middleware.ValidateMainAPIKey)

}

func (api *API) MainAPI() {
	mainRouter := api.router.Group("/main")

	mainRouter.GET("/tables", api.Database.FetchAllTables, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.POST("/query", api.Database.RunQuery, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/query", api.Database.FetchQueryHistory, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/:table_name/columns", api.Database.FetchTableColumns, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/:table_name/rows", api.Database.FetchRows, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.GET("/:table_name/:id", api.Database.FetchDataByID, middleware.ValidateAPIKey)
	mainRouter.POST("/table/create", api.Database.CreateTable, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.POST("/:table_name/insert", api.Database.InsertData, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.PUT("/:table_name/update", api.Database.UpdateData, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.DELETE("/:table_name/rows", api.Database.DeleteData, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.PUT("/:table_name/alter", api.Database.AlterColumn, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.PUT("/:table_name/add_column", api.Database.AddColumn, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.DELETE("/:table_name/delete_column", api.Database.DeleteColumn, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.DELETE("/:table_name", api.Database.DeleteTable, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.POST("/backup", api.Database.Backup, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.POST("/restore/:filename", api.Database.Restore, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.DELETE("/backup/:filename", api.Database.DeleteBackup, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/backup", api.Database.FetchBackups, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
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
	authRouter.GET("/me", api.Auth.GetMyUserID, middleware.RequireAuth(true))
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

func (api *API) LogsAPI() {
	logsRouter := api.router.Group("/logs")

	logsRouter.GET("", api.Logs.Get)
}
