package api

import (
	"funcbase/constants"
	"funcbase/service"

	"github.com/sarulabs/di"
)

type LogAPI interface {
}

type LogAPIImpl struct {
	service *service.Service
}

func NewLogAPI(ioc di.Container) LogAPI {
	return &LogAPIImpl{
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
	}
}

func (api *API) LogAPI() {
	// logRouter := api.router.Group("/log")

}
