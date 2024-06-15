package api

import (
	"net/http"
	"react-golang/src/backend/constants"
	auth_libraries "react-golang/src/backend/library/auth"
	"react-golang/src/backend/model"
	"react-golang/src/backend/utils"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type AdminAPI interface {
	Register(c echo.Context) error
	Login(c echo.Context) error
	FetchAdminList(c echo.Context) error
}

type AdminAPIImpl struct {
	appDb *gorm.DB
}

func NewAdminAPI(ioc di.Container) AdminAPI {
	return &AdminAPIImpl{
		appDb: ioc.Get(constants.CONTAINER_APP_DB_NAME).(*gorm.DB),
	}
}

type registerReq struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AdminAPIImpl) Register(c echo.Context) error {
	var body *registerReq = new(registerReq)
	if err := c.Bind(body); err != nil {
		return c.String(http.StatusBadRequest, "Bad Request")
	}

	var exist int64
	err := h.appDb.Model(&model.Admin{}).
		Where("email = ?", body.Email).
		Count(&exist).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	if exist > 0 {
		return c.String(http.StatusBadRequest, "Email already exists")
	}

	hashedPassword, salt, err := auth_libraries.EncryptPassword(body.Password)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	id, _ := utils.GenerateRandomString(16)
	newAdmin := model.Admin{
		ID:       id,
		Email:    body.Email,
		Username: body.Username,
		Password: hashedPassword,
		Salt:     salt,
	}

	err = h.appDb.Create(&newAdmin).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	token, err := auth_libraries.GenerateJWT(newAdmin.ID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token": token,
	})
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AdminAPIImpl) Login(c echo.Context) error {
	var body *loginReq = new(loginReq)
	if err := c.Bind(body); err != nil {
		return c.String(http.StatusBadRequest, "Bad Request")
	}

	var admin model.Admin
	err := h.appDb.Model(&model.Admin{}).
		Where("email = ?", body.Email).
		First(&admin).Error
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"error": "Invalid email or password",
		})
	}

	if !auth_libraries.VerifyPassword(body.Password, admin.Salt, admin.Password) {
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"error": "Invalid email or password",
		})
	}

	token, err := auth_libraries.GenerateJWT(admin.ID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token": token,
	})
}

func (h *AdminAPIImpl) FetchAdminList(c echo.Context) error {

	var admins []model.Admin

	err := h.appDb.Find(&admins).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, admins)
}
