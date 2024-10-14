package api

import (
	"fmt"
	"funcbase/config"
	"funcbase/constants"
	"funcbase/middleware"
	"funcbase/pkg/logger"
	"funcbase/pkg/responses"
	"funcbase/service"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type LogAPI interface {
	FetchLogs(c echo.Context) error
	Stats(c echo.Context) error
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
	logRouter := api.router.Group("/logs", middleware.ValidateMainAPIKey)

	logRouter.GET("", api.Log.FetchLogs)
	logRouter.GET("/stats", api.Log.Stats)
}

type FetchLogReq struct {
	Page     int    `query:"page"`
	PageSize int    `query:"page_size"`
	Filter   string `query:"filter"`
}

var httpMethods []string = []string{"GET", "POST", "PUT", "DELETE"}
var statusCodes []string = []string{"200", "201", "400", "401", "404", "500", "502", "503"}

func (api *LogAPIImpl) FetchLogs(c echo.Context) error {
	var params *FetchLogReq = new(FetchLogReq)

	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 10
	}

	for _, code := range statusCodes {
		if params.Filter == code {
			params.Filter = fmt.Sprintf("status_code = %s", code)
		}
	}

	for _, method := range httpMethods {
		if params.Filter == method {
			params.Filter = fmt.Sprintf("method = '%s'", method)
		}
	}

	logs, err := api.service.DB.Fetch(api.db, &service.FetchParams{
		Table:  (&logger.Log{}).TableName(),
		Filter: params.Filter,
		Order:  "id DESC",
		Limit:  params.PageSize,
		Offset: (params.Page - 1) * params.PageSize,
	})

	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.APIResponse{
			Error: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, responses.APIResponse{Data: map[string]interface{}{
		"logs":      logs,
		"page_size": params.PageSize,
		"page":      params.Page,
	}})
}

type FetchStatReq struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

type Stat struct {
	Interval string `json:"Time"`
	Count    int    `json:"Request"`
}

func (api *LogAPIImpl) Stats(c echo.Context) error {
	var params *FetchStatReq = new(FetchStatReq)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	configs := config.GetInstance()

	if params.Start == "" || params.End == "" {
		params.Start = time.Now().Add(-time.Hour * time.Duration(configs.LogLifetime)).Format("2006-01-02 15:04:05")
		params.End = time.Now().Format("2006-01-02 15:04:05")
	}

	startTime, err := time.Parse("2006-01-02 15:04:05", params.Start)
	if err != nil {
		return c.JSON(http.StatusBadRequest, responses.APIResponse{
			Error: "Invalid start time format",
		})
	}

	endTime, err := time.Parse("2006-01-02 15:04:05", params.End)
	if err != nil {
		return c.JSON(http.StatusBadRequest, responses.APIResponse{
			Error: "Invalid end time format",
		})
	}

	res := []Stat{}
	err = api.db.
		Table((&logger.Log{}).TableName()).
		Select("strftime('%Y-%m-%d %H:00:00', created_at, 'localtime') as interval", "count(*) as count").
		Where("created_at >= ? AND created_at <= ?", startTime, endTime).
		Group("strftime('%Y-%m-%d %H', created_at, 'localtime')").
		Order("interval").
		Find(&res).
		Error

	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.APIResponse{
			Error: err.Error(),
		})
	}

	logDataMap := make(map[string]int)
	for _, stat := range res {
		logDataMap[stat.Interval] = stat.Count
	}

	filledData := []Stat{}
	currentTime := startTime

	for currentTime.Before(endTime) || currentTime.Equal(endTime) {
		interval := currentTime.Format("2006-01-02 15:00:00")
		count, exists := logDataMap[interval]
		if !exists {
			count = 0 // Default to 0 if no logs for this interval
		}

		filledData = append(filledData, Stat{
			Interval: interval + "Z",
			Count:    count,
		})

		currentTime = currentTime.Add(1 * time.Hour) // Move to the next hour
	}

	return c.JSON(http.StatusOK, responses.APIResponse{Data: filledData})
}
