package main

import (
	"os"
	"react-golang/src/backend/api"
	"react-golang/src/backend/constants"
	"react-golang/src/backend/middleware"
	pkg_sqlite "react-golang/src/backend/pkg/sqlite"
	"react-golang/src/backend/service"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type Module struct {
}

func (m *Module) New(app *echo.Echo) {
	ioc := m.IOC(app)

	middleware.UseMiddleware(app)
	api := ioc.Get(constants.CONTAINER_API_NAME).(*api.API)
	api.Serve()
}

func (m *Module) IOC(app *echo.Echo) di.Container {
	builder, _ := di.NewBuilder()
	_ = builder.Add(
		di.Def{
			Name: constants.CONTAINER_API_NAME,
			Build: func(ctn di.Container) (interface{}, error) {
				return api.NewAPI(app, builder.Build()), nil
			},
		},
		di.Def{
			Name: constants.CONTAINER_DB_NAME,
			Build: func(ctn di.Container) (interface{}, error) {
				db, err := pkg_sqlite.NewSQLiteClient(os.Getenv("DB_PATH"), pkg_sqlite.SQLiteOption{
					Migrate: true,
				})
				return db, err
			},
		},
		di.Def{
			Name: constants.CONTAINER_SERVICE,
			Build: func(ctn di.Container) (interface{}, error) {
				return service.NewService(ctn), nil
			},
		},
	)
	return builder.Build()
}
