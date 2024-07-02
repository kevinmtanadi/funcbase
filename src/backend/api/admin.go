package api

import (
	"fmt"
	"net/http"
	"react-golang/src/backend/constants"
	auth_libraries "react-golang/src/backend/library/auth"
	"react-golang/src/backend/model"
	"react-golang/src/backend/service"
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
	db      *gorm.DB
	service *service.Service
}

func NewAdminAPI(ioc di.Container) AdminAPI {
	return &AdminAPIImpl{
		db:      ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
	}
}

type adminRegisterReq struct {
	Email        string `json:"email"`
	Username     string `json:"username"`
	Password     string `json:"password"`
	ReturnsToken bool   `json:"returns_token"`
}

func (h *AdminAPIImpl) Register(c echo.Context) error {
	var body *adminRegisterReq = new(adminRegisterReq)
	if err := c.Bind(body); err != nil {
		return c.String(http.StatusBadRequest, "Bad Request")
	}

	var exist int64
	err := h.db.Model(&model.Admin{}).
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

	err = h.db.Create(&newAdmin).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	if body.ReturnsToken {
		token, err := auth_libraries.GenerateJWT(map[string]interface{}{
			"sub":   id,
			"email": newAdmin.Email,
			"roles": []string{"user", "admin"},
		})
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "success",
			"token":   token,
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}

type adminLoginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AdminAPIImpl) Login(c echo.Context) error {
	var body *adminLoginReq = new(adminLoginReq)
	if err := c.Bind(body); err != nil {
		return c.String(http.StatusBadRequest, "Bad Request")
	}

	var admin model.Admin
	err := h.db.Model(&model.Admin{}).
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

	token, err := auth_libraries.GenerateJWT(map[string]interface{}{
		"sub":   admin.ID,
		"email": admin.Email,
		"roles": []string{"user", "admin"},
	})
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

	err := h.db.Find(&admins).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	columns := []model.Column{}
	err = h.db.Raw(fmt.Sprintf("PRAGMA table_info(%s)", "admin")).
		Scan(&columns).
		Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	cleanedColumns := []model.Column{}
	for _, column := range columns {
		if column.Name != "password" && column.Name != "salt" {
			cleanedColumns = append(cleanedColumns, column)
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"rows":    admins,
		"columns": cleanedColumns,
	})
}
