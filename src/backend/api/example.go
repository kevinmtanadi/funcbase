package api

import (
	"net/http"
	"react-golang/src/backend/config"
	"react-golang/src/backend/constants"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type ExampleAPI interface {
	Hello(c echo.Context) error
}

type ExampleAPIImpl struct {
	db      *gorm.DB
	configs *config.Config
}

func NewExampleAPI(ioc di.Container) ExampleAPI {
	return &ExampleAPIImpl{
		db:      ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
		configs: ioc.Get(constants.CONTAINER_CONFIG_NAME).(*config.Config),
	}
}

func (h *ExampleAPIImpl) Hello(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"message": "Hello World!"})
}
