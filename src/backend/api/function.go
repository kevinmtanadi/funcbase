package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"react-golang/src/backend/constants"
	"react-golang/src/backend/utils"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type FunctionAPI interface {
	// Input type
	CreateInputType(c echo.Context) error
	FetchInputTypeList(c echo.Context) error

	// Function
	CreateFunction(c echo.Context) error
	FetchFunctionList(c echo.Context) error
	RunFunction(c echo.Context) error
}

type FunctionAPIImpl struct {
	appDb  *gorm.DB
	userDb *gorm.DB
}

func NewFunctionAPI(ioc di.Container) FunctionAPI {
	return FunctionAPIImpl{
		appDb:  ioc.Get(constants.CONTAINER_APP_DB_NAME).(*gorm.DB),
		userDb: ioc.Get(constants.CONTAINER_USER_DB_NAME).(*gorm.DB),
	}
}

type inputTypeJSON struct {
	Name      string          `json:"name"`
	Type      string          `json:"type"`
	Variables []inputTypeJSON `json:"variables,omitempty"`
}

type inputType struct {
	Name string `json:"name"`
	Data string `json:"data"`
}

func (f FunctionAPIImpl) CreateInputType(c echo.Context) error {
	var body *inputTypeJSON = new(inputTypeJSON)
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	json, err := utils.JSONify(body)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}
	newInputType := inputType{
		Name: body.Name,
		Data: json,
	}

	err = f.userDb.Table("input_types").Create(&newInputType).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	return c.JSON(http.StatusOK, json)
}

func (f FunctionAPIImpl) FetchInputTypeList(c echo.Context) error {
	var params *Search = new(Search)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, err)
	}

	query := f.userDb.Table("input_types")
	if params.Search != "" {
		query = query.Where("name LIKE ?", fmt.Sprintf("%%%s%%", params.Search))
	}

	storedInputTypes := []inputType{}
	inputTypes := []inputTypeJSON{}

	err := query.Find(&storedInputTypes).Error
	if err != nil {
		return c.JSON(http.StatusNotFound, err)
	}

	for _, inputType := range storedInputTypes {
		var inputTypeJSON inputTypeJSON
		err := json.Unmarshal([]byte(inputType.Data), &inputTypeJSON)
		if err != nil {
			return err
		}
		inputTypes = append(inputTypes, inputTypeJSON)
	}

	return c.JSON(http.StatusOK, inputTypes)
}

type filter struct {
	Operator   string   `json:"operator"`
	Conditions []filter `json:"conditions"`
	Column     string   `json:"column"`
	Operation  string   `json:"operation"`
	Value      string   `json:"value"`
}

type valueMap struct {
	Column string `json:"column"`
	Value  string `json:"value"`
}

type command struct {
	Type   string     `json:"type"`
	Table  string     `json:"table"`
	Filter filter     `json:"filter,omitempty"`
	Values []valueMap `json:"values"`
}

type FunctionJSON struct {
	FuncName string          `json:"func_name"`
	Inputs   []inputTypeJSON `json:"inputs"`
	Commands []command       `json:"commands"`
}

type Function struct {
	Name string `json:"name" gorm:"column:name"`
	Data string `json:"data"`
}

func (f FunctionAPIImpl) CreateFunction(c echo.Context) error {
	var body *FunctionJSON = new(FunctionJSON)
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, err)
	}

	json, err := utils.JSONify(body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, err)
	}
	newFunction := Function{
		Name: body.FuncName,
		Data: json,
	}

	err = f.appDb.Table("functions").Create(&newFunction).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": "Failed to create function: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, json)
}

func (f FunctionAPIImpl) FetchFunctionList(c echo.Context) error {
	var params *Search = new(Search)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, err)
	}

	query := f.appDb.Table("functions")
	if params.Search != "" {
		query = query.Where("name LIKE ?", fmt.Sprintf("%%%s%%", params.Search))
	}

	storedFunctions := []Function{}
	functions := []FunctionJSON{}

	err := query.Find(&storedFunctions).Error
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": "Failed to fetch functions: " + err.Error(),
		})
	}

	for _, function := range storedFunctions {
		var functionJSON FunctionJSON
		err := json.Unmarshal([]byte(function.Data), &functionJSON)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": "Failed to parse function: " + err.Error(),
			})
		}
		functions = append(functions, functionJSON)
	}

	return c.JSON(http.StatusOK, functions)
}

type runFunctionReq struct {
	FuncName string                 `json:"function"`
	Inputs   map[string]interface{} `json:"data"`
}

func (f FunctionAPIImpl) RunFunction(c echo.Context) error {
	var body *runFunctionReq = new(runFunctionReq)
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusInternalServerError, errors.New("Failed to run function: "+err.Error()))
	}
	inputs := body.Inputs

	var dbFunction Function
	err := f.appDb.Table("functions").Where("name = ?", body.FuncName).First(&dbFunction).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": "Failed to run function: " + err.Error(),
		})
	}

	var function FunctionJSON
	err = json.Unmarshal([]byte(dbFunction.Data), &function)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": "Failed to parse function: " + err.Error(),
		})
	}

	err = f.userDb.Transaction(func(tx *gorm.DB) error {
		for _, cmd := range function.Commands {
			query := tx.Table(cmd.Table)
			switch cmd.Type {
			case "INSERT":
				result := query.Create(buildData(cmd.Values, inputs))
				if result.Error != nil {
					return result.Error
				}
			case "UPDATE":
				query = buildFilterQuery(query, cmd.Filter, inputs)
				result := query.Updates(buildData(cmd.Values, inputs))
				if result.Error != nil {
					return result.Error
				}
			}
		}

		return nil
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": "Failed to run function: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Success",
	})
}

func buildData(values []valueMap, inputs map[string]interface{}) map[string]interface{} {
	var data map[string]interface{} = make(map[string]interface{})

	for _, value := range values {
		if strings.HasPrefix(value.Value, "$.") {
			data[value.Column] = inputs[strings.TrimPrefix(value.Value, "$.")]
		} else {
			data[value.Column] = value.Value
		}
	}

	return data
}

func fetchInputData(key string, inputs map[string]interface{}) interface{} {
	return inputs[strings.TrimPrefix(key, "$.")]
}

func buildFilterQuery(query *gorm.DB, filter filter, inputs map[string]interface{}) *gorm.DB {
	switch filter.Operator {
	case "AND":
		for _, condition := range filter.Conditions {
			query = query.Where(buildFilterQuery(query, condition, inputs))
		}
	case "OR":
		for _, condition := range filter.Conditions {
			query = query.Or(buildFilterQuery(query, condition, inputs))
		}
	default:
		if strings.HasPrefix(filter.Value, "$.") {
			query = query.Where(fmt.Sprintf("%s %s ?", filter.Column, filter.Operation), fetchInputData(filter.Value, inputs))
		} else {
			query = query.Where(fmt.Sprintf("%s %s ?", filter.Column, filter.Operation), filter.Value)
		}
	}

	return query
}
