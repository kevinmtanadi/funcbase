package api

import (
	"react-golang/src/backend/constants"

	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type AdminAPI interface{}

type AdminAPIImpl struct {
	appDb *gorm.DB
}

func NewAdminAPI(ioc di.Container) AdminAPI {
	return AdminAPIImpl{
		appDb: ioc.Get(constants.CONTAINER_APP_DB_NAME).(*gorm.DB),
	}
}
