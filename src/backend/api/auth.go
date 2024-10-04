package api

import (
	"net/http"
	"react-golang/src/backend/constants"
	auth_libraries "react-golang/src/backend/library/auth"
	"react-golang/src/backend/service"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AuthAPI interface {
	Register(c echo.Context) error
	Login(c echo.Context) error
	GetMyUserID(c echo.Context) error
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

	newUser := map[string]interface{}{
		"email":    body.Data["email"],
		"password": hashedPassword,
		"salt":     salt,
	}

	for k, v := range body.Data {
		if k == "id" || k == "email" || k == "password" || k == "salt" {
			continue
		}
		newUser[k] = v
	}

	err = h.db.Table(tableName).Clauses(clause.Returning{
		Columns: []clause.Column{
			{
				Name: "id",
			},
		},
	}).Create(&newUser).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	if body.ReturnsToken {
		token, err := auth_libraries.GenerateJWT(map[string]interface{}{
			"sub":   newUser["id"].(int64),
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
		Limit(1).
		Find(&user).Error
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": "Invalid email or password",
		})
	}
	if user["id"] == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": "Invalid email or password",
		})
	}

	if !auth_libraries.VerifyPassword(body.Data["password"].(string), user["salt"].(string), user["password"].(string)) {
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"error": "Invalid email or password",
		})
	}

	token, err := auth_libraries.GenerateJWT(map[string]interface{}{
		"sub":   user["id"].(int),
		"email": user["email"].(string),
		"role":  tableName,
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

func (h *AuthAPIImpl) GetMyUserID(c echo.Context) error {
	userID, ok := c.Get("user_id").(int)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"error": "JWT Not found",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"userID": userID,
	})
}
