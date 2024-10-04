package api

import (
	"funcbase/config"
	"funcbase/constants"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type SettingAPI interface {
	Get(c echo.Context) error
	Update(c echo.Context) error
}

type SettingAPIImpl struct {
	db     *gorm.DB
	config *config.Config
}

func NewSettingAPI(ioc di.Container) SettingAPI {
	return &SettingAPIImpl{
		db:     ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
		config: config.GetInstance(),
	}
}

type getSettingReq struct {
	Keys string `query:"keys"`
}

func (s *SettingAPIImpl) Get(c echo.Context) error {
	var params *getSettingReq = new(getSettingReq)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	keys := strings.Split(params.Keys, ",")

	settings := map[string]interface{}{}
	for _, key := range keys {
		settings[key] = s.config.Get(key)
	}

	return c.JSON(http.StatusOK, settings)
}

type updateSettingReq struct {
	Data map[string]interface{} `json:"data"`
}

func (s *SettingAPIImpl) Update(c echo.Context) error {
	var params *updateSettingReq = new(updateSettingReq)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	for k, v := range params.Data {
		s.config.Set(k, v)
	}
	s.config.Save()

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}
