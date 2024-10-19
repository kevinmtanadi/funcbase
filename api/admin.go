package api

import (
	"errors"
	"fmt"
	"funcbase/constants"
	auth_libraries "funcbase/library/auth"
	"funcbase/middleware"
	"funcbase/model"
	"funcbase/pkg/responses"
	"funcbase/service"
	"net/http"

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
		db:      ioc.Get(constants.CONTAINER_DB).(*gorm.DB),
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
	}
}

func (api *API) AdminAPI() {
	adminRouter := api.router.Group("/admin", middleware.ValidateMainAPIKey)

	adminRouter.POST("/register", api.Admin.Register)
	adminRouter.POST("/login", api.Admin.Login)
	adminRouter.GET("", api.Admin.FetchAdminList)
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
		return c.JSON(http.StatusBadRequest, responses.NewResponse(nil, "Error binding data", err.Error()))
	}

	var exist int64
	err := h.db.Model(&model.Admin{}).
		Where("email = ?", body.Email).
		Count(&exist).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.NewResponse(nil, "Error when fetching user data", err.Error()))
	}

	if exist > 0 {
		return c.JSON(http.StatusConflict, responses.NewResponse(nil, "Email already exist", errors.New("email registered already exist")))
	}

	hashedPassword, salt, err := auth_libraries.EncryptPassword(body.Password)
	if err != nil {
		responses.NewResponse(nil, "Error hashing password", errors.New("error hashing password"))
	}

	newAdmin := model.Admin{
		Email:    body.Email,
		Username: body.Username,
		Password: hashedPassword,
		Salt:     salt,
	}

	err = h.db.Create(&newAdmin).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.NewResponse(nil, "Email registering new admin", err.Error()))
	}

	if body.ReturnsToken {
		token, err := auth_libraries.GenerateJWT(map[string]interface{}{
			"sub":   newAdmin.ID,
			"email": newAdmin.Email,
			"roles": "ADMIN",
		})
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.NewResponse(nil, "Error generating JWT Token", err.Error()))
		}
		return c.JSON(http.StatusOK, responses.NewResponse(map[string]interface{}{
			"token": token,
		}, "success", nil))
	}

	return c.JSON(http.StatusOK, responses.NewResponse(nil, "success", nil))
}

type adminLoginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AdminAPIImpl) Login(c echo.Context) error {
	var body *adminLoginReq = new(adminLoginReq)
	if err := c.Bind(body); err != nil {
		return c.JSON(http.StatusBadRequest, responses.NewResponse(nil, "Error binding data", err.Error()))
	}

	var admin model.Admin
	err := h.db.Model(&model.Admin{}).
		Where("email = ?", body.Email).
		First(&admin).Error
	if err != nil {
		return c.JSON(http.StatusUnauthorized, responses.NewResponse(nil, "Invalid email or password", errors.New("invalid email or password")))
	}

	if !auth_libraries.VerifyPassword(body.Password, admin.Salt, admin.Password) {
		return c.JSON(http.StatusUnauthorized, responses.NewResponse(nil, "Invalid email or password", errors.New("invalid email or password")))
	}

	token, err := auth_libraries.GenerateJWT(map[string]interface{}{
		"sub":   admin.ID,
		"email": admin.Email,
		"roles": "ADMIN",
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.NewResponse(nil, "Error generating JWT Token", err.Error()))
	}

	return c.JSON(http.StatusOK, responses.NewResponse(map[string]interface{}{
		"token": token,
	}, "success", nil))
}

func (h *AdminAPIImpl) FetchAdminList(c echo.Context) error {
	var admins []model.Admin

	err := h.db.Find(&admins).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.NewResponse(nil, "Error when fetching admin list", err.Error()))
	}

	columns := []model.Column{}
	err = h.db.Raw(fmt.Sprintf("PRAGMA table_info(%s)", (&model.Admin{}).TableName())).
		Scan(&columns).
		Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.APIResponse{
			Data:    nil,
			Message: "Error when fetching admin list",
			Error:   err.Error(),
		})
	}

	cleanedColumns := []model.Column{}
	for _, column := range columns {
		if column.Name != "password" && column.Name != "salt" {
			cleanedColumns = append(cleanedColumns, column)
		}
	}
	for _, column := range columns {
		if column.Name != "password" && column.Name != "salt" {
			cleanedColumns = append(cleanedColumns, column)
		}
	}

	// columns, err := h.service.Table.Columns((&model.Admin{}).TableName(), false)
	// if err != nil {
	// 	if errors.Is(err, gorm.ErrRecordNotFound) {
	// 		return c.JSON(http.StatusOK, responses.APIResponse{
	// 			Data: map[string]interface{}{
	// 				"rows":    admins,
	// 				"columns": columns,
	// 			},
	// 			Message: "success",
	// 		})
	// 	}
	// 	return c.JSON(http.StatusInternalServerError, responses.NewResponse(nil, "Error when fetching admin list", err.Error()))
	// }
	return c.JSON(http.StatusOK, responses.APIResponse{
		Data: map[string]interface{}{
			"rows":    admins,
			"columns": cleanedColumns,
		},
		Message: "success",
	})
}
