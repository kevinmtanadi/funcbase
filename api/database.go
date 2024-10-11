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
	FetchAllTables(c echo.Context) error
	FetchTableColumns(c echo.Context) error
	FetchRows(c echo.Context) error

	CreateTable(c echo.Context) error
	FetchDataByID(c echo.Context) error
	InsertData(c echo.Context) error
	UpdateData(c echo.Context) error
	DeleteData(c echo.Context) error
	DeleteTable(c echo.Context) error
	AlterColumn(c echo.Context) error
	AddColumn(c echo.Context) error
	DeleteColumn(c echo.Context) error

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
		db:      ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
		cache:   ioc.Get(constants.CONTAINER_CACHE).(*cache.Cache),
	}
}

func (api *API) MainAPI() {
	mainRouter := api.router.Group("/main")

	mainRouter.GET("/tables", api.Database.FetchAllTables, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.POST("/query", api.Database.RunQuery, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/query", api.Database.FetchQueryHistory, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/:table_name/columns", api.Database.FetchTableColumns, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.GET("/:table_name/rows", api.Database.FetchRows, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.GET("/:table_name/:id", api.Database.FetchDataByID, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.POST("/table/create", api.Database.CreateTable, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.POST("/:table_name/insert", api.Database.InsertData, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.PUT("/:table_name/update", api.Database.UpdateData, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.DELETE("/:table_name/rows", api.Database.DeleteData, middleware.ValidateAPIKey, middleware.RequireAuth(false))
	mainRouter.PUT("/:table_name/alter", api.Database.AlterColumn, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.PUT("/:table_name/add_column", api.Database.AddColumn, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.DELETE("/:table_name/delete_column", api.Database.DeleteColumn, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))
	mainRouter.DELETE("/:table_name", api.Database.DeleteTable, middleware.ValidateMainAPIKey, middleware.RequireAuth(true))

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
		Select("name, is_auth").
		Where("is_system = ?", false).
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

var sqlTerms = []string{"LIKE", "=", ">=", "<=", ">", "<", "!=", "AND", "OR", "NOT"}

func isSQLTerm(term string) bool {
	if strings.Contains(term, "(") || strings.Contains(term, ")") {
		return true
	}

	for _, sqlTerm := range sqlTerms {
		if strings.Contains(term, sqlTerm) {
			return true
		}
	}
	return false
}

func (d *DatabaseAPIImpl) FetchRows(c echo.Context) error {
	tableName := c.Param("table_name")
	var res fetchRowsRes

	table, err := d.service.Table.Info(tableName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, responses.NewResponse(nil, "Error fetching table data", err.Error()))
	}

	var params *fetchRowsParam = new(fetchRowsParam)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	columns := "*"
	if table.IsAuth {
		columnsArr, err := d.service.Table.Columns(tableName, false)

		if err != nil {
			return err
		}

		columns = ""

		for _, column := range columnsArr {
			col := column["name"].(*interface{})
			if *col == "password" || *col == "salt" {
				continue
			}

			if columns != "" {
				columns = fmt.Sprintf("%s, %s", columns, *col)
				continue
			}
			columns = fmt.Sprintf("%s", *col)
		}
	}

	paramUser := c.Get("user_id")
	var userID int
	if paramUser != nil {
		userID = paramUser.(int)
	}

	rawQuery := `
	SELECT %s FROM %s
	`
	query := fmt.Sprintf(rawQuery, columns, tableName)

	filters := []string{}
	if params.Filter != "" {
		if strings.Contains(params.Filter, "$user.id") {
			params.Filter = strings.ReplaceAll(params.Filter, "$user.id", string(userID))
		}

		if isSQLTerm(params.Filter) {
			filters = append(filters, params.Filter)
			query = query + `WHERE ` + params.Filter
		} else {
			columns, err := d.service.Table.Columns(tableName, false)
			if err != nil {
				return c.JSON(http.StatusBadRequest, map[string]interface{}{
					"message": "failed to get columns",
					"error":   err.Error(),
				})
			}

			for _, column := range columns {
				cName := column["name"].(*interface{})
				filters = append(filters, fmt.Sprintf("%s LIKE ('%%%s%%')", *cName, params.Filter))
			}
			query = query + `WHERE ` + strings.Join(filters, " OR ")
		}
	}
	if params.Sort != "" {
		query = query + ` ORDER BY ` + params.Sort
	}
	if params.Page == 0 {
		params.Page = 1
	}
	if params.PageSize == 0 {
		params.PageSize = 20
	}
	query = query + ` LIMIT ` + strconv.Itoa(params.PageSize) + ` OFFSET ` + strconv.Itoa((params.Page-1)*params.PageSize)

	res.Data = make([]map[string]interface{}, 0)
	if err := d.db.Raw(query).
		Find(&res.Data).
		Error; err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if params.GetCount {
		rawCountQuery := `
		SELECT COUNT(*) FROM %s
		`
		query = fmt.Sprintf(rawCountQuery, tableName)
		if params.Filter != "" {
			query = query + `WHERE ` + strings.Join(filters, " OR ")
		}
		if err := d.db.Raw(query).First(&res.TotalData).Error; err != nil {
			return c.JSON(http.StatusBadRequest, map[string]interface{}{
				"error": err.Error(),
			})
		}
	}

	res.Page = params.Page
	res.PageSize = params.PageSize

	return c.JSON(http.StatusOK, res)
}

type field struct {
	Type         string `json:"field_type"`
	Name         string `json:"field_name"`
	Nullable     bool   `json:"nullable"`
	RelatedTable string `json:"related_table,omitempty"`
	Indexed      bool   `json:"indexed"`
	Unique       bool   `json:"unique"`
}

func (f *field) convertTypeToSQLiteType() string {
	switch f.Type {
	case "text":
		return "TEXT"
	case "number":
		return "REAL"
	case "boolean":
		return "BOOLEAN"
	case "datetime":
		return "DATETIME"
	case "file":
		return "BLOB"
	case "relation":
		return "RELATION"
	default:
		return ""
	}
}

type createTableReq struct {
	TableName string  `json:"table_name"`
	IDType    string  `json:"id_type"`
	Fields    []field `json:"fields"`
	Type      string  `json:"table_type"`
}

func (d *DatabaseAPIImpl) CreateTable(c echo.Context) error {
	var params *createTableReq = new(createTableReq)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	id := "id INTEGER PRIMARY KEY"

	// switch params.IDType {
	// case "string":
	// 	id = fmt.Sprintf(id, "TEXT PRIMARY KEY DEFAULT (hex(randomblob(8)))")
	// case "manual":
	// 	id = fmt.Sprintf(id, "TEXT PRIMARY KEY")
	// default:
	// 	return echo.NewHTTPError(http.StatusBadRequest, "Invalid id type")
	// }

	fields := []string{
		id,
	}

	isAuth := false

	if params.Type == "users" {
		authFields := []string{
			"email TEXT NOT NULL",
			"password TEXT NOT NULL",
			"salt TEXT NOT NULL",
		}
		isAuth = true

		fields = append(fields, authFields...)
	}

	foreignKeys := []string{}
	uniques := []string{}
	indexes := []string{}

	for i := 0; i < len(params.Fields); i++ {
		dtype := params.Fields[i].convertTypeToSQLiteType()
		// IGNORE UNSUPPORTED DATATYPES FOR NOW
		if dtype == "" {
			continue
		}

		var field string
		if dtype == "RELATION" {
			field = fmt.Sprintf("%s %s", params.Fields[i].Name, "TEXT")
			foreignKeys = append(foreignKeys, fmt.Sprintf("FOREIGN KEY(%s) REFERENCES %s(id) ON UPDATE CASCADE", params.Fields[i].Name, params.Fields[i].RelatedTable))
		} else {
			field = fmt.Sprintf("%s %s", params.Fields[i].Name, dtype)
		}

		if !params.Fields[i].Nullable {
			field += " NOT NULL"
		}

		if params.Fields[i].Indexed {
			indexes = append(indexes, fmt.Sprintf("CREATE INDEX idx_%s ON %s (%s)", params.Fields[i].Name, params.TableName, params.Fields[i].Name))
		}

		if params.Fields[i].Unique {
			uniques = append(uniques, fmt.Sprintf("UNIQUE (%s)", params.Fields[i].Name))
		}

		fields = append(fields, field)
	}

	fields = append(fields, []string{
		"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
	}...)

	fields = append(append(fields, uniques...), foreignKeys...)

	query := `
		CREATE TABLE %s (
			%s
		)
	`

	query = fmt.Sprintf(query, params.TableName, strings.Join(fields, ","))

	err := d.db.Transaction(func(tx *gorm.DB) error {
		err := d.db.Exec(query).Error
		if err != nil {
			return err
		}

		// add index
		for _, index := range indexes {
			err = d.db.Exec(index).Error
			if err != nil {
				return err
			}
		}

		// check if trigger already exist
		var triggerHolder int64
		err = d.db.Table("sqlite_master").
			Select("*").
			Where("type = ?", "trigger").
			Where("name = ?", fmt.Sprintf("updated_timestamp_%s", params.TableName)).
			Count(&triggerHolder).Error
		if err != nil {
			return err
		}

		// add trigger to update updated_at value on update
		if triggerHolder == 0 {
			err = d.db.Exec(fmt.Sprintf(`
			CREATE TRIGGER updated_timestamp_%s
			AFTER UPDATE ON %s
			FOR EACH ROW
			BEGIN
				UPDATE %s SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
			END
			`, params.TableName, params.TableName, params.TableName)).Error
			if err != nil {
				return err
			}
		}
		err = d.db.Create(
			&model.Tables{
				Name:     params.TableName,
				IsAuth:   isAuth,
				IsSystem: false,
			}).
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

func (d *DatabaseAPIImpl) FetchDataByID(c echo.Context) error {
	tableName := c.Param("table_name")
	id := c.Param("id")
	var result map[string]interface{} = make(map[string]interface{}, 0)

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

// TODO
// Allow use of application/json
func (d *DatabaseAPIImpl) InsertData(c echo.Context) error {
	tableName := c.Param("table_name")
	table, err := d.service.Table.Info(tableName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	if table.IsAuth {
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

		err = d.service.Table.Insert(tableName, filteredData)
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

		err = d.service.Table.Update(tableName, filteredData)
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

		err = d.service.Table.Insert(tableName, param)
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

// TODO
// Allow use of application/json
func (d *DatabaseAPIImpl) UpdateData(c echo.Context) error {
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

		err = d.service.Table.Update(tableName, updatedData)
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

		err := d.service.Table.Update(tableName, param)
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

func (d *DatabaseAPIImpl) DeleteData(c echo.Context) error {
	tableName := c.Param("table_name")

	var params *deleteDataReq = new(deleteDataReq)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	err := d.service.Table.BatchDelete(tableName, params.ID)
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
		err := d.db.Exec(fmt.Sprintf("DROP TABLE %s", tableName)).Error
		if err != nil {
			return err
		}

		err = d.db.
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

type alterColumns struct {
	Original string `json:"original"`
	Altered  string `json:"altered"`
}
type alterColumnReq struct {
	Columns []alterColumns `json:"columns"`
}

func (d *DatabaseAPIImpl) AlterColumn(c echo.Context) error {
	alterColumns := new(alterColumnReq)

	tableName := c.Param("table_name")

	if err := c.Bind(&alterColumns); err != nil {
		return c.JSON(http.StatusBadRequest, errors.New("Failed to bind: "+err.Error()))
	}

	query := fmt.Sprintf("ALTER TABLE %s", tableName)
	for _, column := range alterColumns.Columns {
		query = fmt.Sprintf("%s RENAME %s TO %s", query, column.Original, column.Altered)
	}

	err := d.db.Exec(query).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	cacheKey := "columns_" + tableName
	d.cache.Delete(cacheKey)

	return c.JSON(http.StatusOK, nil)
}

type addColumnReq struct {
	Fields []field `json:"fields"`
}

func (d *DatabaseAPIImpl) AddColumn(c echo.Context) error {
	tableName := c.Param("table_name")
	params := new(addColumnReq)

	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, errors.New("Failed to bind: "+err.Error()))
	}

	query := fmt.Sprintf("ALTER TABLE %s ADD COLUMN ", tableName)
	fields := []string{}
	foreignKeys := []string{}
	uniques := []string{}
	indexes := []string{}

	for i := 0; i < len(params.Fields); i++ {
		dtype := params.Fields[i].convertTypeToSQLiteType()
		// IGNORE UNSUPPORTED DATATYPES FOR NOW
		if dtype == "" {
			continue
		}

		var field string
		if dtype == "RELATION" {
			field = fmt.Sprintf("%s %s", params.Fields[i].Name, "TEXT")
			foreignKeys = append(foreignKeys, fmt.Sprintf("FOREIGN KEY(%s) REFERENCES %s(id) ON UPDATE CASCADE", params.Fields[i].Name, params.Fields[i].RelatedTable))
		} else {
			field = fmt.Sprintf("%s %s", params.Fields[i].Name, dtype)
		}

		if !params.Fields[i].Nullable {
			field += " NOT NULL"
		}

		if params.Fields[i].Indexed {
			indexes = append(indexes, fmt.Sprintf("CREATE INDEX idx_%s ON %s (%s)", params.Fields[i].Name, tableName, params.Fields[i].Name))
		}

		if params.Fields[i].Unique {
			uniques = append(uniques, fmt.Sprintf("UNIQUE (%s)", params.Fields[i].Name))
		}

		fields = append(fields, field)
	}

	query = fmt.Sprintf("%s %s", query, strings.Join(fields, ", "))

	err := d.db.Transaction(func(tx *gorm.DB) error {
		err := d.db.Exec(query).Error
		if err != nil {
			return err
		}

		// add index
		for _, index := range indexes {
			err = d.db.Exec(index).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"message": "Failed to add column",
			"error":   err.Error(),
		})
	}

	cacheKey := "columns_" + tableName
	d.cache.Delete(cacheKey)

	return c.JSON(http.StatusOK, nil)
}

type deleteColumnReq struct {
	Columns []string `json:"columns"`
}

func (d *DatabaseAPIImpl) DeleteColumn(c echo.Context) error {
	tableName := c.Param("table_name")

	params := new(deleteColumnReq)

	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, errors.New("Failed to bind: "+err.Error()))
	}

	err := d.db.Transaction(func(tx *gorm.DB) error {
		for _, col := range params.Columns {
			query := fmt.Sprintf("ALTER TABLE %s DROP COLUMN %s", tableName, col)

			err := d.db.Exec(query).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"message": "Failed when deleting column",
			"error":   err.Error(),
		})
	}

	cacheKey := "columns_" + tableName
	d.cache.Delete(cacheKey)

	return c.JSON(http.StatusOK, nil)
}
