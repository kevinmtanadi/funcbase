package api

import (
	"fmt"
	"net/http"
	"react-golang/src/backend/constants"
	"react-golang/src/backend/utils"
	"strings"

	"github.com/labstack/echo/v4"
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
	RunQuery(c echo.Context) error
	DeleteTable(c echo.Context) error
}

type DatabaseAPIImpl struct {
	db *gorm.DB
}

func NewDatabaseAPI(ioc di.Container) DatabaseAPI {
	return &DatabaseAPIImpl{
		db: ioc.Get(constants.CONTAINER_USER_DB_NAME).(*gorm.DB),
	}
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

	query := d.db.Table("sqlite_master").
		Select("name").
		Where("type = ?", "table").
		Where("name != ?", "sqlite_sequence").
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

func (d *DatabaseAPIImpl) FetchTableColumns(c echo.Context) error {
	tableName := c.Param("table_name")
	var result []map[string]interface{} = make([]map[string]interface{}, 0)

	if err := d.db.Raw(fmt.Sprintf("PRAGMA table_info(%s)", tableName)).
		Scan(&result).
		Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, result)
}

type filter struct {
	Column   string `json:"column"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

type fetchRowsParam struct {
	Filter []filter `json:"filters,omitempty"`
}

func (d *DatabaseAPIImpl) FetchRows(c echo.Context) error {
	tableName := c.Param("table_name")
	var result []map[string]interface{} = make([]map[string]interface{}, 0)

	var params *fetchRowsParam = new(fetchRowsParam)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	query := d.db.Table(tableName).
		Select("*")

	for _, filter := range params.Filter {
		query = query.Where(fmt.Sprintf("%s %s ?", filter.Column, filter.Operator), filter.Value)
	}

	if err := query.
		Find(&result).
		Error; err != nil {
		return err
	}

	return c.JSON(http.StatusOK, result)
}

type fields struct {
	FieldType    string `json:"field_type"`
	FieldName    string `json:"field_name"`
	Nullable     bool   `json:"nullable"`
	RelatedTable string `json:"related_table,omitempty"`
	Indexed      bool   `json:"indexed"`
	Unique       bool   `json:"unique"`
}

func (f *fields) convertTypeToSQLiteType() string {
	switch f.FieldType {
	case "text":
		return "TEXT"
	case "number":
		return "REAL"
	case "boolean":
		return "BOOLEAN"
	case "datetime":
		return "DATETIME"
	case "file":
		return ""
	case "relation":
		return "RELATION"
	default:
		return ""
	}
}

type createTableReq struct {
	TableName string   `json:"table_name"`
	IDType    string   `json:"id_type"`
	Fields    []fields `json:"fields"`
}

func (d *DatabaseAPIImpl) CreateTable(c echo.Context) error {
	var params *createTableReq = new(createTableReq)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	id := "id %s"

	switch params.IDType {
	case "string":
		id = fmt.Sprintf(id, "TEXT PRIMARY KEY DEFAULT (hex(randomblob(8)))")
	case "manual":
		id = fmt.Sprintf(id, "TEXT PRIMARY KEY")
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid id type")
	}

	fields := []string{
		id,
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
			field = fmt.Sprintf("%s %s", params.Fields[i].FieldName, "TEXT")
			foreignKeys = append(foreignKeys, fmt.Sprintf("FOREIGN KEY(%s) REFERENCES %s(id) ON UPDATE CASCADE", params.Fields[i].FieldName, params.Fields[i].RelatedTable))
		} else {
			field = fmt.Sprintf("%s %s", params.Fields[i].FieldName, dtype)
		}

		if !params.Fields[i].Nullable {
			field += " NOT NULL"
		}

		if params.Fields[i].Indexed {
			indexes = append(indexes, fmt.Sprintf("CREATE INDEX idx_%s ON %s (%s)", params.Fields[i].FieldName, params.TableName, params.Fields[i].FieldName))
		}

		if params.Fields[i].Unique {
			uniques = append(uniques, fmt.Sprintf("UNIQUE (%s)", params.Fields[i].FieldName))
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

	err := d.db.Exec(query).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	// add index
	for _, index := range indexes {
		err = d.db.Exec(index).Error
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
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
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
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
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}
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

type insertDataReq struct {
	TableName string                 `json:"table_name"`
	Data      map[string]interface{} `json:"data"`
}

func (d *DatabaseAPIImpl) InsertData(c echo.Context) error {
	var params *insertDataReq = new(insertDataReq)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	filteredData := make(map[string]interface{})
	for k, v := range params.Data {
		if k == "id" && (v == 0 || v == "") {
			continue
		}
		if v != nil && v != "" {
			filteredData[k] = v
		}
	}

	filteredData["id"], _ = utils.GenerateRandomString(16)

	result := d.db.Table(params.TableName).
		Create(&filteredData)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, params.Data)
}

type updateDataReq struct {
	TableName string                 `json:"table_name"`
	ID        string                 `json:"id"`
	Data      map[string]interface{} `json:"data"`
}

func (d *DatabaseAPIImpl) UpdateData(c echo.Context) error {
	var params *updateDataReq = new(updateDataReq)
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	result := d.db.Table(params.TableName).
		Where("id = ?", params.ID).
		Updates(&params.Data)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, params.Data)
}

func (d *DatabaseAPIImpl) DeleteData(c echo.Context) error {
	tableName := c.Param("table_name")
	id := c.Param("id")

	result := d.db.Table(tableName).
		Where("id = ?", id).
		Delete(nil)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": result.Error.Error(),
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

	rows, err := d.db.Raw(params.Query).Rows()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	defer rows.Close()

	var result []map[string]interface{} = make([]map[string]interface{}, 0)

	for rows.Next() {
		var row map[string]interface{}
		if err := d.db.ScanRows(rows, &row); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}
		result = append(result, row)
	}

	return c.JSON(http.StatusOK, result)
}

func (d *DatabaseAPIImpl) DeleteTable(c echo.Context) error {
	tableName := c.Param("table_name")

	err := d.db.Exec(fmt.Sprintf("DROP TABLE %s", tableName)).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, nil)
}
