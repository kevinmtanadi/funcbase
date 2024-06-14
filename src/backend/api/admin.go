package api

import (
	"net/http"
	"react-golang/src/backend/constants"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type AdminAPI interface {
	RegisterNewAdmin(c echo.Context) error
}

type AdminAPIImpl struct {
	appDb *gorm.DB
}

func NewAdminAPI(ioc di.Container) AdminAPI {
	return &AdminAPIImpl{
		appDb: ioc.Get(constants.CONTAINER_APP_DB_NAME).(*gorm.DB),
	}
}

func (h *AdminAPIImpl) RegisterNewAdmin(c echo.Context) error {

	return c.String(http.StatusOK, "Hello, World!")
}
