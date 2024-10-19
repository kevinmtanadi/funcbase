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
	fmt.Println(datas)
	for _, data := range datas {
		if data == "columns" {
			response["columns"], err = d.service.Table.Columns(tableName, false)
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
}

func (d *DatabaseAPIImpl) FetchTableColumns(c echo.Context) error {
	tableName := c.Param("table_name")

	var params *fetchColumn = new(fetchColumn)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	result, err := d.service.Table.Columns(tableName, params.FetchAuthColumn)
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
	tableName := c.Param("table_name")
	var res fetchRowsRes

	var params *fetchRowsParam = new(fetchRowsParam)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	paramUser := c.Get("user_id")
	var userID int
	if paramUser != nil {
		userID = paramUser.(int)
	}

	if strings.Contains(params.Filter, "$user.id") {
		params.Filter = strings.ReplaceAll(params.Filter, "$user.id", string(userID))
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
	tableName := c.Param("table_name")
	id := c.Param("id")
	var result map[string]interface{} = make(map[string]interface{}, 0)

	roles := c.Get("roles")
	if roles != "ADMIN" {
		fmt.Println(roles)
		info, err := d.service.Table.Info(tableName, service.TABLE_INFO_VIEW_RULE)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, responses.APIResponse{
				Message: "Error fetching data",
				Error:   err.Error(),
			})
		}

		if info.ViewRule != "" {
			fmt.Println(info.ViewRule)

			// @user.id = users

			// @user.id != null

			// stock >= 0

		}

	}

	if err := d.db.Table(tableName).
		Select("*").
		Where("id = ?", id).
		Find(&result).
		Limit(1).
		Error; err != nil {
		return err
	}

	return c.JSON(http.StatusOK, result)
}

func (d *DatabaseAPIImpl) Insert(c echo.Context) error {
	tableName := c.Param("table_name")
	table, err := d.service.Table.Info(tableName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	if table.Auth {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "Insertion to user type table can only be done through auth API",
		})
	}

	contentType := c.Request().Header.Get("Content-Type")

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
			if v[0] == "$user.id" {
				if c.Get("user_id") == nil {
					return c.JSON(http.StatusBadRequest, map[string]interface{}{
						"error": "User not authorized",
					})
				}
				filteredData[k] = c.Get("user_id")
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
	tableName := c.Param("table_name")

	contentType := c.Request().Header.Get("Content-Type")
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

		for k, v := range form.Value {
			if len(v) == 0 || k == "created_at" || k == "updated_at" {
				continue
			}
			if v[0] == "" {
				continue
			}
			updatedData[k] = v[0]
		}

		updatedData["updated_at"] = time.Now()
		id := updatedData["id"].(string)

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
	tableName := c.Param("table_name")

	var params *deleteDataReq = new(deleteDataReq)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	err := d.service.DB.BatchDelete(d.db, tableName, params.ID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
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
	return c.JSON(http.StatusOK, nil)
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

	tableInfo, err := d.service.Table.Info(params.TableName)
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
