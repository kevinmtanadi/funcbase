package api

import (
	"net/http"
	pkg_logger "react-golang/src/backend/pkg/logger"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type LogsAPI interface {
	Get(c echo.Context) error
}

type LogsAPIImpl struct {
}

func NewLogsAPI(ioc di.Container) LogsAPI {
	return &LogsAPIImpl{}
}

func (l *LogsAPIImpl) Get(c echo.Context) error {
	logs := pkg_logger.Logs
	return c.JSON(http.StatusOK, logs)
}
