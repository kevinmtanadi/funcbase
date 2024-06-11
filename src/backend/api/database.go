package api

import (
	"fmt"
	"net/http"
	"react-golang/src/backend/constants"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/mattn/go-sqlite3"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type DatabaseAPI interface {
	FetchAllTables(c echo.Context) error
	FetchTableColumns(c echo.Context) error
	FetchRows(c echo.Context) error

	CreateTable(c echo.Context) error
	InsertData(c echo.Context) error
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

func (d *DatabaseAPIImpl) FetchRows(c echo.Context) error {
	tableName := c.Param("table_name")
	var result []map[string]interface{} = make([]map[string]interface{}, 0)

	if err := d.db.Table(tableName).
		Select("*").
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
	Nullable  bool     `json:"nullable"`
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

		if !params.Nullable {
			field += " NOT NULL"
		}

		fields = append(fields, field)
	}

	fields = append(fields, []string{
		"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
	}...)

	fields = append(fields, foreignKeys...)

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

	maxTries := 10

	tries := 0
	for {
		tries++
		if tries > maxTries {
			return echo.NewHTTPError(http.StatusInternalServerError, "Failed to insert data")
		}

		result := d.db.Table(params.TableName).
			Create(&filteredData)
		if result.Error != nil {
			if sqliteErr, ok := result.Error.(*sqlite3.Error); ok &&
				sqliteErr.Code == sqlite3.ErrConstraint {
				continue
			} else {
				break
			}
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
