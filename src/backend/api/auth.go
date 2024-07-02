package api

import (
	"fmt"
	"net/http"
	"react-golang/src/backend/constants"
	auth_libraries "react-golang/src/backend/library/auth"
	"react-golang/src/backend/service"
	"react-golang/src/backend/utils"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type AuthAPI interface {
	Register(c echo.Context) error
	Login(c echo.Context) error
}

type AuthAPIImpl struct {
	db      *gorm.DB
	service *service.Service
}

func NewAuthAPI(ioc di.Container) AuthAPI {
	return &AuthAPIImpl{
		db:      ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
	}
}

type registerReq struct {
	Data         map[string]interface{} `json:"data"`
	ReturnsToken bool                   `json:"returns_token"`
}

func (h *AuthAPIImpl) Register(c echo.Context) error {
	tableName := c.Param("table_name")

	var body *registerReq = new(registerReq)
	if err := c.Bind(body); err != nil {
		return c.JSON(http.StatusBadRequest, "Error binding request")
	}

	if body.Data["email"] == nil || body.Data["password"] == nil {
		return c.JSON(http.StatusBadRequest, "Email or password is empty")
	}

	table, err := h.service.Table.Info(tableName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	if !table.IsAuth {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "table is not user type"})
	}

	var exist int64
	err = h.db.Table(tableName).
		Where("email = ?", body.Data["email"]).
		Count(&exist).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	if exist > 0 {
		return c.String(http.StatusBadRequest, "Email already exists")
	}

	hashedPassword, salt, err := auth_libraries.EncryptPassword(body.Data["password"].(string))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	id, _ := utils.GenerateRandomString(16)
	newUser := map[string]interface{}{
		"email":    body.Data["email"],
		"password": hashedPassword,
		"salt":     salt,
	}

	for k, v := range body.Data {
		newUser[k] = v
	}

	newUser["id"] = id

	fmt.Println(newUser)

	err = h.db.Table(tableName).Create(&newUser).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	if body.ReturnsToken {
		token, err := auth_libraries.GenerateJWT(map[string]interface{}{
			"sub":   newUser["id"].(string),
			"email": newUser["email"].(string),
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

type loginReq struct {
	Data map[string]interface{} `json:"data"`
}

func (h *AuthAPIImpl) Login(c echo.Context) error {
	tableName := c.Param("table_name")

	var body *loginReq = new(loginReq)
	if err := c.Bind(body); err != nil {
		return c.String(http.StatusBadRequest, "Bad Request")
	}

	if body.Data["email"] == nil || body.Data["password"] == nil {
		return c.String(http.StatusBadRequest, "Bad Request")
	}

	table, err := h.service.Table.Info(tableName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	if !table.IsAuth {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "table is not user type"})
	}

	var user map[string]interface{}
	err = h.db.Table(tableName).
		Where("email = ?", body.Data["email"]).
		First(&user).Error
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"error": "Invalid email or password",
		})
	}

	if !auth_libraries.VerifyPassword(body.Data["password"].(string), user["salt"].(string), user["password"].(string)) {
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"error": "Invalid email or password",
		})
	}

	token, err := auth_libraries.GenerateJWT(map[string]interface{}{
		"sub":   user["id"].(string),
		"email": user["email"].(string),
		"roles": []string{"user", tableName},
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
