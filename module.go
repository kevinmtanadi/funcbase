package main

import (
	"fmt"
	"funcbase/api"
	"funcbase/constants"
	"funcbase/middleware"
	"funcbase/model"
	"funcbase/pkg/cache"
	pkg_sqlite "funcbase/pkg/sqlite"
	"funcbase/service"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type Module struct {
}

func (m *Module) New(app *echo.Echo) {
	ioc := m.IOC(app)

	go RunBatch(ioc)

	dbPath := fmt.Sprintf("%s/%s", constants.DATA_PATH, constants.LOG_DB_PATH)
	loggerDb, err := pkg_sqlite.NewSQLiteClient(dbPath)
	if err != nil {
		panic(err)
	}
	loggerDb.Migrator().AutoMigrate(&model.Log{})

	middleware.UseMiddleware(app, loggerDb)
	api := ioc.Get(constants.CONTAINER_API).(*api.API)
	api.Serve()
}

func (m *Module) IOC(app *echo.Echo) di.Container {
	builder, _ := di.NewBuilder()
	_ = builder.Add(
		di.Def{
			Name: constants.CONTAINER_API,
			Build: func(ctn di.Container) (interface{}, error) {
				return api.NewAPI(app, builder.Build()), nil
			},
		},
		di.Def{
			Name: constants.CONTAINER_DB,
			Build: func(ctn di.Container) (interface{}, error) {
				dbPath := fmt.Sprintf("%s/%s", constants.DATA_PATH, constants.DB_PATH)
				db, err := pkg_sqlite.NewSQLiteClient(dbPath, pkg_sqlite.SQLiteOption{
					Migrate:  true,
					Optimize: true,
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
		di.Def{
			Name: constants.CONTAINER_CACHE,
			Build: func(ctn di.Container) (interface{}, error) {
				cache, err := cache.NewCache()
				return cache, err
			},
		},
	)
	return builder.Build()
}
