package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type API struct {
	app      *echo.Echo
	router   *echo.Group
	Admin    AdminAPI
	Database DatabaseAPI
	Function FunctionAPI
}

type Search struct {
	Search string `json:"search" query:"search"`
}

func NewAPI(app *echo.Echo, ioc di.Container) *API {
	return &API{
		app:      app,
		router:   app.Group("/api"),
		Admin:    NewAdminAPI(ioc),
		Database: NewDatabaseAPI(ioc),
		Function: NewFunctionAPI(ioc),
	}
}

func (api *API) Serve() {
	api.DbAPI()
	api.FunctionAPI()
}

func (api *API) DbAPI() {
	dbRouter := api.router.Group("/db")

	dbRouter.GET("/tables", api.Database.FetchAllTables)
	dbRouter.POST("/query", api.Database.RunQuery)
	dbRouter.GET("/table/:table_name/columns", api.Database.FetchTableColumns)
	dbRouter.GET("/table/:table_name/rows", api.Database.FetchRows)
	dbRouter.POST("/table/create", api.Database.CreateTable)
	dbRouter.POST("/table/insert", api.Database.InsertData)
}

func (api *API) AdminAPI() {
	adminRouter := api.router.Group("/admin")

	adminRouter.GET("/users", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})
}

func (api *API) FunctionAPI() {
	functionRouter := api.router.Group("/function")

	functionRouter.POST("/input_type", api.Function.CreateInputType)
	functionRouter.GET("/input_type", api.Function.FetchInputTypeList)

	functionRouter.POST("/run", api.Function.RunFunction)
	functionRouter.POST("", api.Function.CreateFunction)
	functionRouter.GET("", api.Function.FetchFunctionList)
}
