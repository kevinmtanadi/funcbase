package api

import (
	"funcbase/constants"
	"funcbase/pkg/logger"
	"funcbase/pkg/responses"
	"funcbase/service"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type LogAPI interface {
	FetchLogs(c echo.Context) error
}

type LogAPIImpl struct {
	db      *gorm.DB
	service *service.Service
}

func NewLogAPI(ioc di.Container) LogAPI {
	return &LogAPIImpl{
		db:      logger.GetInstance(),
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
	}
}

func (api *API) LogAPI() {
	logRouter := api.router.Group("/log")

	logRouter.GET("", api.Log.FetchLogs)
}

func (api *LogAPIImpl) FetchLogs(c echo.Context) error {
	logs, err := api.service.DB.Fetch(api.db, &service.FetchOption{
		Table:  (&logger.Log{}).TableName(),
		Filter: "",
		Order:  "id DESC",
		Limit:  10,
		Offset: 0,
	})

	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.APIResponse{
			Error: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, responses.APIResponse{Data: logs})
}
