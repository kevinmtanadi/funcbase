package main

import (
	"react-golang/src/backend/api"
	"react-golang/src/backend/config"
	"react-golang/src/backend/constants"
	"react-golang/src/backend/middleware"
	pkg_sqlite "react-golang/src/backend/pkg/sqlite"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type Module struct {
}

func (m *Module) New(app *echo.Echo) {
	ioc := m.IOC()

	middleware.UseMiddleware(app)

	api := ioc.Get(constants.CONTAINER_API_NAME).(*api.API)
	api.Serve(app)
}

func (m *Module) IOC() di.Container {
	builder, _ := di.NewBuilder()
	_ = builder.Add(
		di.Def{
			Name: constants.CONTAINER_API_NAME,
			Build: func(ctn di.Container) (interface{}, error) {
				return api.NewAPI(builder.Build()), nil
			},
		},
		di.Def{
			Name: constants.CONTAINER_DB_NAME,
			Build: func(ctn di.Container) (interface{}, error) {
				db, err := pkg_sqlite.NewSQLiteClient()
				return db, err
			},
		},
		di.Def{
			Name: constants.CONTAINER_CONFIG_NAME,
			Build: func(ctn di.Container) (interface{}, error) {
				configs := config.NewConfig(builder.Build())
				return configs, nil
			},
		},
	)
	return builder.Build()
}
