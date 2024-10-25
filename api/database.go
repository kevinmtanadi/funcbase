package api

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"funcbase/constants"
	"funcbase/middleware"
	"funcbase/model"
	"funcbase/pkg/responses"
	"funcbase/service"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/patrickmn/go-cache"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type DatabaseAPI interface {
	CreateTable(c echo.Context) error
	FetchAllTables(c echo.Context) error
	FetchTableInfo(c echo.Context) error
	FetchTableColumns(c echo.Context) error
	UpdateTable(c echo.Context) error
	DeleteTable(c echo.Context) error
	FetchTableAccess(c echo.Context) error
	UpdateTableAccess(c echo.Context) error

	View(c echo.Context) error
	List(c echo.Context) error
	Insert(c echo.Context) error
	Update(c echo.Context) error
	Delete(c echo.Context) error

	RunQuery(c echo.Context) error
	FetchQueryHistory(c echo.Context) error
}

type DatabaseAPIImpl struct {
	db      *gorm.DB
	service *service.Service
	cache   *cache.Cache
}

func NewDatabaseAPI(ioc di.Container) DatabaseAPI {
	return &DatabaseAPIImpl{
		db:      ioc.Get(constants.CONTAINER_DB).(*gorm.DB),
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
		cache:   ioc.Get(constants.CONTAINER_CACHE).(*cache.Cache),
	}
}

func (api *API) MainAPI() {
	mainRouter := api.router.Group("/main")

	mainRouter.POST("/table/create", api.Database.CreateTable, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/tables", api.Database.FetchAllTables, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/table/:table_name", api.Database.FetchTableInfo, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/:table_name/columns", api.Database.FetchTableColumns, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.PUT("/table/update", api.Database.UpdateTable, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.DELETE("/:table_name", api.Database.DeleteTable, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/table/:table_name/access", api.Database.FetchTableAccess, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.PUT("/table/access", api.Database.UpdateTableAccess, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))

	mainRouter.GET("/:table_name/:id", api.Database.View, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.GET("/:table_name/rows", api.Database.List, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.POST("/:table_name/insert", api.Database.Insert, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.PUT("/:table_name/update", api.Database.Update, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.DELETE("/:table_name/rows", api.Database.Delete, middleware.ValidateAPIKey, middleware.RequireAuth(false))

	mainRouter.POST("/query", api.Database.RunQuery, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/query", api.Database.FetchQueryHistory, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
}

type DBResult []map[string]interface{}

func (d *DatabaseAPIImpl) FetchAllTables(c echo.Context) error {
	var result []map[string]interface{} = make([]map[string]interface{}, 0)

	var params *Search = new(Search)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	query := d.db.Model(&model.Tables{}).
		Select("name", "auth").
		Where("system = ?", false).
		Order("name ASC")

	if params.Search != "" {
		query = query.Where("name LIKE ?", fmt.Sprintf("%%%s%%", params.Search))
	}

	err := query.Find(&result).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, result)
}

type fetchTableInfo struct {
	Data string `json:"data" query:"data"`
}

func (d *DatabaseAPIImpl) FetchTableInfo(c echo.Context) error {
	tableName := c.Param("table_name")

	var params *fetchTableInfo = new(fetchTableInfo)
	var response map[string]interface{} = make(map[string]interface{})

	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	table, err := d.service.Table.Info(tableName, service.TABLE_INFO_INDEXES)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.APIResponse{
			Message: "Error fetching table info",
			Error:   err.Error(),
		})
	}
	response["index"] = table.SystemIndex

	datas := strings.Split(params.Data, ",")
	for _, data := range datas {
		if data == "columns" {
			response["columns"], err = d.service.Table.Columns(tableName, false, false)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, responses.APIResponse{
					Message: "Error fetching table info",
					Error:   err.Error(),
				})
			}
		}
	}

	return c.JSON(http.StatusOK, responses.APIResponse{
		Data: response,
	})
}

type fetchColumn struct {
	FetchAuthColumn bool `json:"fetch_auth_column" query:"fetch_auth_column"`
	FetchTableType  bool `json:"table_type" query:"table_type"`
}

func (d *DatabaseAPIImpl) FetchTableColumns(c echo.Context) error {
	tableName := c.Param("table_name")

	var params *fetchColumn = new(fetchColumn)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	result, err := d.service.Table.Columns(tableName, params.FetchAuthColumn, params.FetchTableType)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, result)
}

type fetchRowsParam struct {
	Filter   string `query:"filter"`
	Sort     string `query:"sort"`
	Page     int    `query:"page"`
	PageSize int    `query:"page_size"`
	GetCount bool   `query:"get_count"`
}

type fetchRowsRes struct {
	Data      []map[string]interface{} `json:"data"`
	Page      int                      `json:"page"`
	PageSize  int                      `json:"page_size"`
	TotalData int64                    `json:"total_data"`
}

func (d *DatabaseAPIImpl) List(c echo.Context) error {
	var (
		tableName                  = c.Param("table_name")
		params     *fetchRowsParam = new(fetchRowsParam)
		res        fetchRowsRes
		requestUID = c.Get("user_id")
	)

	var userId int
	var ok bool
	if requestUID != nil {
		userId, ok = requestUID.(int)
		if !ok {
			userId = 0
		}
		userId = int(userId)
	}

	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if strings.Contains(params.Filter, "@user.id") {
		if userId == 0 {
			return c.JSON(http.StatusBadRequest, map[string]interface{}{
				"error": "User ID is required",
			})
		}
		str := fmt.Sprintf("%d", userId)
		params.Filter = strings.ReplaceAll(params.Filter, "@user.id", str)
	}

	data, err := d.service.DB.Fetch(d.db, &service.FetchParams{
		Table:  tableName,
		Filter: params.Filter,
		Order:  params.Sort,
		Limit:  params.PageSize,
		Offset: (params.Page - 1) * params.PageSize,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.APIResponse{
			Message: "Error fetching data",
			Error:   err.Error(),
		})
	}
	res.Data = data

	if params.GetCount {
		count, err := d.service.DB.Count(d.db, &service.FetchParams{
			Table:  tableName,
			Filter: params.Filter,
		})

		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Message: "Error fetching data",
				Error:   err.Error(),
			})
		}
		res.TotalData = count
	}

	res.Page = params.Page
	res.PageSize = params.PageSize

	return c.JSON(http.StatusOK, res)
}

func (d *DatabaseAPIImpl) CreateTable(c echo.Context) error {
	var params *model.CreateTable = new(model.CreateTable)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	err := d.db.Transaction(func(tx *gorm.DB) error {
		err := d.service.Table.Create(tx, *params)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, nil)
}

func (d *DatabaseAPIImpl) View(c echo.Context) error {
	var (
		tableName                              = c.Param("table_name")
		requestID                              = c.Param("id")
		requestUID                             = c.Get("user_id")
		result          map[string]interface{} = make(map[string]interface{}, 0)
		roles                                  = c.Get("roles")
		referencedTable                        = ""
	)

	var userId int
	var ok bool
	if requestUID != nil {
		userId, ok = requestUID.(int)
		if !ok {
			userId = 0
		}
		userId = int(userId)
	}

	var id int
	var err error
	if requestID != "" {
		id, err = strconv.Atoi(requestID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, responses.APIResponse{
				Message: "ID must be an integer",
				Error:   err.Error(),
			})
		}
		id = int(id)
	}

	if roles != "ADMIN" {
		tableInfo, err := d.service.Table.Info(tableName, service.TABLE_INFO_ACCESS, service.TABLE_INFO_AUTH)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Message: "Error fetching data",
				Error:   err.Error(),
			})
		}

		viewAccess := tableInfo.Access.View()
		switch viewAccess {
		case "0":
			return c.JSON(http.StatusForbidden, responses.APIResponse{
				Message: "You don't have access to view this data",
				Error:   "Data restricted",
			})
		case "1":
			if userId == 0 {
				return c.JSON(http.StatusForbidden, responses.APIResponse{
					Message: "You don't have access to view this data",
					Error:   "Data restricted",
				})
			}
		case "2":
			// ignore since data is public
		default:
			if tableInfo.Auth {
				if userId != id {
					return c.JSON(http.StatusForbidden, responses.APIResponse{
						Message: "You don't have access to view this data because you dont own it",
						Error:   "Data restricted",
					})
				}
			} else {
				referencedTable = viewAccess
			}
		}
	}

	if err := d.db.Table(tableName).
		Select("*").
		Where("id = ?", requestID).
		Find(&result).
		Limit(1).
		Error; err != nil {
		return err
	}

	if referencedTable != "" {
		userTable := int(result[referencedTable].(float64))
		if userTable != userId {
			return c.JSON(http.StatusForbidden, responses.APIResponse{
				Message: "You don't have access to view this data 3",
				Error:   "Data restricted",
			})
		}
	}

	return c.JSON(http.StatusOK, result)
}

func (d *DatabaseAPIImpl) Insert(c echo.Context) error {
	var (
		tableName   = c.Param("table_name")
		userId      = c.Get("user_id")
		roles       = c.Get("roles")
		contentType = c.Request().Header.Get("Content-Type")
	)
	tableInfo, err := d.service.Table.Info(tableName, service.TABLE_INFO_ACCESS, service.TABLE_INFO_AUTH)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if roles != "ADMIN" {
		insertAccess := tableInfo.Access.Create()
		switch insertAccess {
		case "0":
			return c.JSON(http.StatusForbidden, responses.APIResponse{
				Message: "You don't have access to this data",
				Error:   "Data restricted",
			})
		case "1":
			if userId == nil {
				return c.JSON(http.StatusForbidden, responses.APIResponse{
					Message: "You don't have access to this data",
					Error:   "Data restricted",
				})
			}
		case "2":
		default:
			// ignore since data is public
		}
	}

	if tableInfo.Auth {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "Insertion to user type table can only be done through auth API",
		})
	}

	switch {
	case strings.HasPrefix(contentType, "multipart/form-data"):
		err := c.Request().ParseMultipartForm(32 << 20) // 32 MB max
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]interface{}{
				"error": "Failed to parse multipart form",
			})
		}
		defer c.Request().MultipartForm.RemoveAll()

		filteredData := make(map[string]interface{})

		form := c.Request().MultipartForm

		for k, v := range form.Value {
			if len(v) == 0 || k == "id" || k == "created_at" || k == "updated_at" {
				continue
			}
			if v[0] == "" {
				continue
			}
			if v[0] == "@user.id" {
				if userId == nil {
					return c.JSON(http.StatusBadRequest, map[string]interface{}{
						"error": "User not authorized",
					})
				}
				filteredData[k] = userId
			}
			filteredData[k] = v[0]
		}

		err = d.service.DB.Insert(d.db, tableName, filteredData)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Data:    nil,
				Message: "failed to insert data",
				Error:   err.Error(),
			})
		}

		for k, files := range form.File {
			file, err := files[0].Open()
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"error": "Failed to open file",
				})
			}

			defer file.Close()

			newFileName := base64.StdEncoding.EncodeToString([]byte(string(filteredData["id"].(int64)) + k))
			fileExtension := filepath.Ext(files[0].Filename)

			storageDir := filepath.Join(storagePath, newFileName+fileExtension)
			err = d.service.Storage.Save(file, storageDir)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"error": err.Error(),
				})
			}

			filteredData[k] = fmt.Sprintf("%s%s", newFileName, fileExtension)
			continue
		}

		err = d.service.DB.Update(d.db, tableName, filteredData)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Data:    nil,
				Message: "failed to update data",
				Error:   err.Error(),
			})
		}

		return c.JSON(http.StatusOK, responses.APIResponse{
			Data:    filteredData,
			Message: "success",
			Error:   nil,
		})
	case contentType == "application/json":
		param := map[string]interface{}{}
		if err := json.NewDecoder(c.Request().Body).Decode(&param); err != nil {
			return c.JSON(http.StatusBadRequest, responses.APIResponse{
				Data:    nil,
				Message: "failed to decode JSON data",
				Error:   err.Error(),
			})
		}

		for k, v := range param {
			if v == "@user.id" {
				if userId == nil {
					return c.JSON(http.StatusBadRequest, map[string]interface{}{
						"error": "User not authorized",
					})
				}
				param[k] = userId
			}
		}

		err = d.service.DB.Insert(d.db, tableName, param)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Data:    param,
				Message: "failed to insert data",
				Error:   err.Error(),
			})
		}

		return c.JSON(http.StatusCreated, responses.APIResponse{
			Data:    param,
			Message: "success",
		})
	default:
		return c.JSON(http.StatusBadRequest, responses.APIResponse{
			Data:    nil,
			Message: "Invalid content type",
			Error:   "invalid content type" + contentType,
		})
	}
}

func (d *DatabaseAPIImpl) Update(c echo.Context) error {
	var (
		tableName       = c.Param("table_name")
		contentType     = c.Request().Header.Get("Content-Type")
		requestUID      = c.Get("user_id")
		roles           = c.Get("roles")
		referencedTable = ""
	)

	var userId int
	var ok bool
	if requestUID != nil {
		userId, ok = requestUID.(int)
		if !ok {
			userId = 0
		}
		userId = int(userId)
	}

	var isAuth = false
	if roles != "ADMIN" {
		tableInfo, err := d.service.Table.Info(tableName, service.TABLE_INFO_ACCESS, service.TABLE_INFO_AUTH)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Data:    nil,
				Message: "failed to get table info",
				Error:   err.Error(),
			})
		}

		updateAccess := tableInfo.Access.Update()
		switch updateAccess {
		case "0":
			return c.JSON(http.StatusForbidden, responses.APIResponse{
				Message: "You don't have access to this data",
				Error:   "Data restricted",
			})
		case "1":
			if userId == 0 {
				return c.JSON(http.StatusForbidden, responses.APIResponse{
					Message: "You don't have access to this data",
					Error:   "Data restricted",
				})
			}
		case "2":
			// ignore since data is public
		default:
			if tableInfo.Auth {
				isAuth = true
			} else {
				referencedTable = updateAccess
			}
		}
	}

	switch {
	case strings.HasPrefix(contentType, "multipart/form-data"):
		err := c.Request().ParseMultipartForm(32 << 20) // 32 MB max
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": "Failed to parse multipart form",
			})
		}

		updatedData := make(map[string]interface{})
		form := c.Request().MultipartForm

		id := ""
		for k, v := range form.Value {
			if len(v) == 0 || k == "created_at" || k == "updated_at" {
				continue
			}
			if v[0] == "" {
				continue
			}
			if k == "id" {
				id = v[0]
			}
			if v[0] == "@user.id" {
				if userId == 0 {
					return c.JSON(http.StatusBadRequest, responses.APIResponse{
						Message: "User not authorized",
						Error:   "Token not found",
					})
				}
				updatedData[k] = userId
			}
			updatedData[k] = v[0]
		}

		if id == "" {
			return c.JSON(http.StatusBadRequest, responses.APIResponse{
				Message: "Data ID is required to update",
				Error:   "ID not found",
			})
		}

		if isAuth && strconv.Itoa(userId) != id {
			return c.JSON(http.StatusForbidden, responses.APIResponse{
				Message: "You don't have access to this data",
				Error:   "Data restricted",
			})
		}

		updatedData["updated_at"] = time.Now()

		for k, files := range form.File {
			file, err := files[0].Open()
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"error": "Failed to open file",
				})
			}

			defer file.Close()

			newFileName := base64.StdEncoding.EncodeToString([]byte(string(id) + k))
			fileExtension := filepath.Ext(files[0].Filename)
			storageDir := filepath.Join(storagePath, newFileName+fileExtension)

			err = d.service.Storage.Save(file, storageDir)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"error": err.Error(),
				})
			}

			updatedData[k] = fmt.Sprintf("%s%s", newFileName, fileExtension)
			continue
		}

		if referencedTable != "" {
			data, err := d.service.DB.Fetch(d.db, &service.FetchParams{
				Table:   tableName,
				Filter:  fmt.Sprintf("id = '%s'", id),
				Columns: []string{referencedTable},
				Limit:   1,
			})
			if err != nil {
				return c.JSON(http.StatusInternalServerError, responses.APIResponse{
					Message: "failed to fetch data",
					Error:   err.Error(),
				})
			}
			if data[0][referencedTable] == nil {
				return c.JSON(http.StatusNotFound, responses.APIResponse{
					Message: "user data not found",
					Error:   "user data not found",
				})
			}
			if data[0][referencedTable] != userId {
				return c.JSON(http.StatusForbidden, responses.APIResponse{
					Message: "You don't have access to this data",
					Error:   "Data restricted",
				})
			}
		}

		err = d.service.DB.Update(d.db, tableName, updatedData)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}

		return c.JSON(http.StatusOK, responses.APIResponse{
			Data:    updatedData,
			Message: "success",
			Error:   nil,
		})
	case contentType == "application/json":
		param := map[string]interface{}{}
		if err := json.NewDecoder(c.Request().Body).Decode(&param); err != nil {
			return c.JSON(http.StatusBadRequest, responses.APIResponse{
				Data:    nil,
				Message: "failed to decode JSON data",
				Error:   err.Error(),
			})
		}

		if param["id"] == nil {
			return c.JSON(http.StatusBadRequest, responses.APIResponse{
				Message: "Data ID is required to update",
				Error:   "ID not found",
			})
		}

		id := param["id"].(float64)
		if isAuth && int(userId) != int(id) {
			return c.JSON(http.StatusForbidden, responses.APIResponse{
				Message: "You don't have access to this data",
				Error:   "Data restricted",
			})
		}

		for k, v := range param {
			if v == "" {
				continue
			}
			if v == "@user.id" {
				if userId == 0 {
					return c.JSON(http.StatusBadRequest, responses.APIResponse{
						Message: "User not authorized",
						Error:   "Token not found",
					})
				}
				param[k] = userId
			}
		}

		if referencedTable != "" {
			data, err := d.service.DB.Fetch(d.db, &service.FetchParams{
				Table:   tableName,
				Filter:  fmt.Sprintf("id = '%s'", param["id"]),
				Columns: []string{referencedTable},
				Limit:   1,
			})
			if err != nil {
				return c.JSON(http.StatusInternalServerError, responses.APIResponse{
					Message: "failed to fetch data",
					Error:   err.Error(),
				})
			}
			if data[0][referencedTable] == nil {
				return c.JSON(http.StatusNotFound, responses.APIResponse{
					Message: "user data not found",
					Error:   "user data not found",
				})
			}
			if data[0][referencedTable] != userId {
				return c.JSON(http.StatusForbidden, responses.APIResponse{
					Message: "You don't have access to this data",
					Error:   "Data restricted",
				})
			}
		}

		err := d.service.DB.Update(d.db, tableName, param)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Data:    param,
				Message: "failed to insert data",
				Error:   err.Error(),
			})
		}

		return c.JSON(http.StatusCreated, responses.APIResponse{
			Data:    param,
			Message: "success",
		})
	default:
		return c.JSON(http.StatusBadRequest, responses.APIResponse{
			Data:    nil,
			Message: "Invalid content type",
			Error:   "invalid content type" + contentType,
		})
	}

}

type deleteDataReq struct {
	ID []string `json:"id"`
}

func (d *DatabaseAPIImpl) Delete(c echo.Context) error {
	var (
		tableName                      = c.Param("table_name")
		params          *deleteDataReq = new(deleteDataReq)
		referencedTable                = ""
		userId                         = c.Get("user_id")
		roles                          = c.Get("roles")
	)

	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if roles != "ADMIN" {
		tableInfo, err := d.service.Table.Info(tableName, service.TABLE_INFO_ACCESS, service.TABLE_INFO_AUTH)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Message: "failed to fetch data",
				Error:   err.Error(),
			})
		}

		deleteAccess := tableInfo.Access.Delete()
		switch deleteAccess {
		case "0":
			return c.JSON(http.StatusForbidden, responses.APIResponse{
				Message: "You don't have access to this data",
				Error:   "Data restricted",
			})
		case "1":
			if userId == nil {
				return c.JSON(http.StatusForbidden, responses.APIResponse{
					Message: "You don't have access to this data",
					Error:   "Data restricted",
				})
			}
		case "2":
			// ignore since data is public
		default:
			if tableInfo.Auth {
				if len(params.ID) > 0 {
					return c.JSON(http.StatusForbidden, responses.APIResponse{
						Message: "On delete user data, only 1 data can be deleted at a time",
						Error:   "Multiple ID not allowed",
					})
				}
				if strconv.Itoa(userId.(int)) != params.ID[0] {
					return c.JSON(http.StatusForbidden, responses.APIResponse{
						Message: "You don't have access to this data",
						Error:   "Data restricted",
					})
				}
			} else {
				referencedTable = deleteAccess
			}
		}
	}

	for _, id := range params.ID {
		if referencedTable != "" {
			data, err := d.service.DB.Fetch(d.db, &service.FetchParams{
				Table:   tableName,
				Filter:  fmt.Sprintf("id = '%s'", id),
				Columns: []string{referencedTable},
				Limit:   1,
			})
			if err != nil {
				return c.JSON(http.StatusInternalServerError, responses.APIResponse{
					Message: "failed to fetch data",
					Error:   err.Error(),
				})
			}
			if data[0][referencedTable] == nil {
				return c.JSON(http.StatusNotFound, responses.APIResponse{
					Message: "Referenced table is empty",
					Error:   "Data not found",
				})
			}
			if data[0][referencedTable] != strconv.Itoa(userId.(int)) {
				return c.JSON(http.StatusForbidden, responses.APIResponse{
					Message: "You don't have access to this data",
					Error:   "Data restricted",
				})
			}
		}
		err := d.service.DB.BatchDelete(d.db, tableName, []string{id})
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}
	}

	return c.JSON(http.StatusOK, nil)
}

type queryReq struct {
	Query string
}

func (d *DatabaseAPIImpl) RunQuery(c echo.Context) error {
	var params *queryReq = new(queryReq)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	var result []map[string]interface{} = make([]map[string]interface{}, 0)

	rows, err := d.db.Raw(params.Query).Rows()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	defer rows.Close()

	for rows.Next() {
		var row map[string]interface{}
		if err := d.db.ScanRows(rows, &row); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}

		result = append(result, row)
	}

	go func(query string) {
		d.db.Create(&model.QueryHistory{
			Query: query,
		})

		d.db.Exec(`
		DELETE FROM query_history
		WHERE id NOT IN (
			SELECT id
			FROM (
				SELECT id
				FROM query_history
				ORDER BY id DESC
				LIMIT 10
			)
		);
		`)
	}(params.Query)

	return c.JSON(http.StatusOK, result)
}

func (d *DatabaseAPIImpl) FetchQueryHistory(c echo.Context) error {
	var queryHistories []model.QueryHistory

	result := d.db.Limit(10).Order("id DESC").Find(&queryHistories)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, queryHistories)
}

func (d *DatabaseAPIImpl) DeleteTable(c echo.Context) error {
	tableName := c.Param("table_name")

	err := d.db.Transaction(func(tx *gorm.DB) error {
		err := tx.Exec(fmt.Sprintf("DROP TABLE %s", tableName)).Error
		if err != nil {
			return err
		}

		err = tx.
			Where("lower(name) = ?", strings.ToLower(tableName)).
			Delete(&model.Tables{}).
			Error
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	d.cache.Delete(fmt.Sprintf("columns_%s", tableName))
	tableInfoCache := []string{service.TABLE_INFO_NAME, service.TABLE_INFO_AUTH, service.TABLE_INFO_INDEXES, service.TABLE_INFO_SYSTEM, service.TABLE_INFO_ACCESS}
	for _, info := range tableInfoCache {
		d.cache.Delete(fmt.Sprintf("tableInfo:%s:%s", tableName, info))
	}

	return c.JSON(http.StatusOK, nil)
}

func (d *DatabaseAPIImpl) FetchTableAccess(c echo.Context) error {
	var (
		table = c.Param("table_name")
	)

	tableInfo, err := d.service.Table.Info(table, service.TABLE_INFO_ACCESS)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.APIResponse{
			Message: "Failed to fetch table access",
			Error:   err.Error(),
		})
	}

	return c.JSON(http.StatusOK, responses.APIResponse{
		Data:    tableInfo.Access,
		Message: "Table access fetched successfully",
	})
}

type updateTableAccessReq struct {
	TableName string `json:"table_name"`
	Access    []struct {
		Value     string `json:"value"`
		Reference string `json:"reference"`
	} `json:"access"`
}

func (d *DatabaseAPIImpl) UpdateTableAccess(c echo.Context) error {
	params := new(updateTableAccessReq)

	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, responses.APIResponse{
			Message: "Failed to bind requets body",
			Error:   err.Error(),
		})
	}

	accessValue := []string{}
	for _, access := range params.Access {
		switch access.Value {
		case "0", "1", "2":
			accessValue = append(accessValue, access.Value)
		case "3":
			if access.Reference == "" {
				accessValue = append(accessValue, access.Value)
			} else {
				accessValue = append(accessValue, access.Reference)
			}
		default:
			return c.JSON(http.StatusBadRequest, responses.APIResponse{
				Message: "Invalid access value",
				Error:   "Invalid access value",
			})
		}

	}

	err := d.db.Model(&model.Tables{}).
		Where("name = ?", params.TableName).
		Update("access", strings.Join(accessValue, ";")).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.APIResponse{
			Message: "Failed to update table access",
			Error:   err.Error(),
		})
	}

	d.cache.Delete(fmt.Sprintf("tableInfo:%s:%s", params.TableName, service.TABLE_INFO_ACCESS))

	return c.JSON(http.StatusOK, responses.APIResponse{
		Message: "Table access updated successfully",
	})
}

type updateTableReq struct {
	TableName        string `json:"table_name"`
	UpdatedTableName string `json:"updated_table_name"`
	// fields
	Fields []model.Field `json:"fields"`
	// indexes
	Indexes []model.Index `json:"indexes"`
}

func (d *DatabaseAPIImpl) UpdateTable(c echo.Context) error {
	params := new(updateTableReq)

	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, errors.New("Failed to bind: "+err.Error()))
	}

	tableInfo, err := d.service.Table.Info(params.TableName, service.TABLE_INFO_AUTH)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	tableType := "general"
	if tableInfo.Auth {
		tableType = "auth"
	}

	if len(params.Fields) > 0 || len(params.Indexes) > 0 {
		if params.TableName == params.UpdatedTableName {
			fmt.Println("Same table name")
			err = d.db.Transaction(func(tx *gorm.DB) error {
				// rename table to something else
				tempTableName := "_temp_" + params.TableName
				err := d.service.Table.Rename(tx, params.TableName, tempTableName)
				if err != nil {
					return err
				}

				indexes, err := d.service.Table.Indexes(params.TableName)
				if err != nil {
					return err
				}

				fmt.Println("Found indexes", indexes)

				if len(indexes) > 0 {
					err = d.service.Table.DropIndexes(tx, indexes)
					if err != nil {
						return err
					}
				}

				// create new table with same name
				err = d.service.Table.Create(tx, model.CreateTable{
					Name:    params.TableName,
					Fields:  params.Fields,
					Indexes: params.Indexes,
					Type:    tableType,
				})
				if err != nil {
					return err
				}

				// copy all data from old table to new table
				err = tx.Raw("INSERT INTO " + params.TableName + " SELECT * FROM " + tempTableName).Error
				if err != nil {
					return err
				}

				// delete old table
				err = d.service.Table.Drop(tx, tempTableName)
				if err != nil {
					return err
				}

				return nil
			})

		} else {
			fmt.Println("Different table name")
			err = d.db.Transaction(func(tx *gorm.DB) error {
				// create new table with the new table name
				err = d.service.Table.Create(tx, model.CreateTable{
					Name:    params.UpdatedTableName,
					Fields:  params.Fields,
					Indexes: params.Indexes,
					Type:    tableType,
				})

				// copy all data from old table to new table
				err = tx.Raw("INSERT INTO " + params.UpdatedTableName + " SELECT * FROM " + params.TableName).Error
				if err != nil {
					return err
				}

				// delete old table
				err = d.service.Table.Drop(tx, params.TableName)
				return err
			})
		}

		d.cache.Delete("columns_" + params.TableName)
		d.cache.Delete("columns_" + params.UpdatedTableName)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"message": "Failed to update table",
				"error":   err.Error(),
			})
		}

		return c.JSON(http.StatusOK, responses.APIResponse{
			Message: "success",
		})
	}

	err = d.service.Table.Rename(d.db, params.TableName, params.UpdatedTableName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"message": "Failed to update table name",
			"error":   err.Error(),
		})
	}

	return c.JSON(http.StatusOK, responses.APIResponse{
		Message: "success",
	})
}
