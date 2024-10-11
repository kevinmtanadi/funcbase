package api

import (
	"funcbase/config"
	"funcbase/constants"
	"funcbase/middleware"
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
		db:     ioc.Get(constants.CONTAINER_DB).(*gorm.DB),
		config: config.GetInstance(),
	}
}

func (api *API) SettingAPI() {
	settingRouter := api.router.Group("/settings", middleware.ValidateMainAPIKey)

	settingRouter.GET("", api.Setting.Get)
	settingRouter.PUT("", api.Setting.Update)
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

	errs := []string{}
	for k, v := range params.Data {
		err := s.config.Set(k, v)
		if err != nil {
			errs = append(errs, err.Error())
		}
	}
	s.config.Save()

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
		"errors":  errs,
	})
}
