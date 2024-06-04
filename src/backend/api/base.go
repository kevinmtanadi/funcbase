package api

import (
	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type API struct {
	Example ExampleAPI
}

func NewAPI(ioc di.Container) *API {
	return &API{
		Example: NewExampleAPI(ioc),
	}
}

func (api *API) Serve(app *echo.Echo) {
	apiRoute := app.Group("/api")

	apiRoute.GET("/hello", api.Example.Hello)
}
