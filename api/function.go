package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"funcbase/constants"
	"funcbase/middleware"
	"funcbase/model"
	"funcbase/service"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FunctionAPI interface {
	CreateFunction(c echo.Context) error
	FetchFunctionList(c echo.Context) error
	FetchFunctionDetail(c echo.Context) error
	DeleteFunction(c echo.Context) error
	RunFunction(c echo.Context) error
}

type FunctionAPIImpl struct {
	db      *gorm.DB
	service *service.Service
}

func NewFunctionAPI(ioc di.Container) FunctionAPI {
	return &FunctionAPIImpl{
		db:      ioc.Get(constants.CONTAINER_DB).(*gorm.DB),
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
	}
}

func (api *API) FunctionAPI() {
	api.router.POST("/:func_name", api.Function.RunFunction, middleware.RequireAuth(false), middleware.ValidateAPIKey)
	api.router.GET("/function", api.Function.FetchFunctionList, middleware.ValidateMainAPIKey)
	api.router.GET("/function/:func_name", api.Function.FetchFunctionDetail, middleware.ValidateMainAPIKey)
	api.router.DELETE("/function/:func_name", api.Function.DeleteFunction, middleware.ValidateMainAPIKey)
	api.router.POST("/function/create", api.Function.CreateFunction, middleware.ValidateMainAPIKey)
}

type Caller struct {
	Data map[string]interface{} `json:"data"`
}

type Function struct {
	Name     string                 `json:"name"`
	Action   string                 `json:"action"`
	Table    string                 `json:"table"`
	Multiple bool                   `json:"multiple"`
	Values   map[string]interface{} `json:"values"`
	Columns  []string               `json:"columns"`
}

type functionReq struct {
	Name      string     `json:"name"`
	Functions []Function `json:"functions"`
}

func (f FunctionAPIImpl) CreateFunction(c echo.Context) error {
	var body *functionReq = new(functionReq)
	if err := c.Bind(body); err != nil {
		return c.JSON(http.StatusBadRequest, errors.New("Failed to bind: "+err.Error()))
	}

	// convert functions to json
	jsonFunc, err := json.Marshal(body.Functions)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	newFunction := model.FunctionStored{
		Name:     body.Name,
		Function: string(jsonFunc),
	}

	err = f.db.Model(&model.FunctionStored{}).Create(&newFunction).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}

func (f FunctionAPIImpl) FetchFunctionList(c echo.Context) error {
	var search *Search = new(Search)

	var functions []model.FunctionStored
	table := f.db.Select("name")
	if search.Search != "" {
		table = table.Where("name LIKE ?", fmt.Sprintf("%%%s%%", search.Search))
	}
	err := table.Find(&functions).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, functions)
}

func (f FunctionAPIImpl) FetchFunctionDetail(c echo.Context) error {
	funcName := c.Param("func_name")

	var funcStored model.FunctionStored
	err := f.db.Where("name = ?", funcName).First(&funcStored).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	var function functionReq
	function.Name = funcName
	err = json.Unmarshal([]byte(funcStored.Function), &function.Functions)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, function)
}

func (f FunctionAPIImpl) DeleteFunction(c echo.Context) error {
	funcName := c.Param("func_name")
	err := f.db.Model(&model.FunctionStored{}).Where("name = ?", funcName).Delete(&model.FunctionStored{}).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, nil)
}

func (f FunctionAPIImpl) RunFunction(c echo.Context) error {
	funcName := c.Param("func_name")
	var function *model.FunctionStored

	paramUser := c.Get("user_id")
	var userID string
	if paramUser != nil {
		userID = paramUser.(string)
	}

	err := f.db.Model(&model.FunctionStored{}).Where("name = ?", funcName).First(&function).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, map[string]interface{}{
				"error": "function does not exist",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	functions := []Function{}
	err = json.Unmarshal([]byte(function.Function), &functions)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	var caller *Caller = new(Caller)
	if err := c.Bind(caller); err != nil {
		return c.JSON(http.StatusBadRequest, errors.New("Failed to bind: "+err.Error()))
	}

	savedData := map[string]interface{}{}
	err = f.db.Transaction(func(db *gorm.DB) error {
		for _, fun := range functions {
			switch fun.Action {
			case "insert":
				if data, ok := caller.Data[fun.Name].([]interface{}); ok {
					bindedInput := BindMultipleInput(fun.Values, data, savedData, userID)

					err := db.Table(fun.Table).Create(bindedInput).Error
					if err != nil {
						return err
					}
				} else if data, ok := caller.Data[fun.Name].(map[string]interface{}); ok {
					bindedInput := BindSingularInput(fun.Values, data, savedData, userID)
					err := db.Table(fun.Table).Clauses(clause.Returning{
						Columns: []clause.Column{
							{
								Name: "id",
							},
						},
					}).Create(bindedInput).Error
					if err != nil {
						return err
					}

					savedData[fun.Name] = bindedInput["id"]
				}

			case "update":
				if data, ok := caller.Data[fun.Name].([]map[string]interface{}); ok {
					for _, input := range data {
						filter := map[string]interface{}{
							"id = ?": input["id"],
						}

						bindedInput := BindSingularInput(fun.Values, input, savedData, userID)
						table := db.Table(fun.Table)
						for k, v := range filter {
							table = table.Where(k, v)
						}
						err := table.Updates(bindedInput).Error
						if err != nil {
							return err
						}
					}
				} else if data, ok := caller.Data[fun.Name].(map[string]interface{}); ok {
					filter := map[string]interface{}{
						"id = ?": data["id"],
					}

					bindedInput := BindSingularInput(fun.Values, data, savedData, userID)
					table := db.Table(fun.Table)
					for k, v := range filter {
						table = table.Where(k, v)
					}
					err := table.Updates(bindedInput).Error
					if err != nil {
						return err
					}
				}
			case "delete":
				data := caller.Data[fun.Name].(map[string]interface{})
				filter := ""
				if ft, ok := data["filter"].(string); ok {
					filter = ft
					if strings.Contains(filter, "$user.id") {
						filter = strings.ReplaceAll(ft, "$user.id", userID)
					}
				} else {
					return errors.New("filter cant be empty when deleting")
				}

				query := `
					DELETE FROM %s
					WHERE %s
				`

				err := db.Exec(fmt.Sprintf(query, fun.Table, filter)).Error
				if err != nil {
					return err
				}
			case "fetch":
				data := caller.Data[fun.Name].(map[string]interface{})
				columns := []string{"*"}
				if col, ok := data["columns"].([]string); ok {
					columns = col
				}

				filter := ""
				if ft, ok := data["filter"].(string); ok {
					filter = ft
				}

				query := `
					SELECT %s
					FROM %s
				`
				query = fmt.Sprintf(query, strings.Join(columns, ","), fun.Table)
				if filter != "" {
					query = query + fmt.Sprintf("WHERE %s", filter)
				}

				err := db.Exec(fmt.Sprintf(query, fun.Table, filter)).Error
				if err != nil {
					return err
				}

				result := []map[string]interface{}{}
				savedData[fun.Name] = result
			}
		}

		return nil
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, savedData)
}

func Where(query *gorm.DB, key string, value interface{}) *gorm.DB {
	return query.Where(fmt.Sprintf("%s = ?", key), value)
}

func Or(query *gorm.DB, key string, value interface{}) *gorm.DB {
	return query.Or(fmt.Sprintf("%s = ?", key), value)
}

// parseCalculation
//
// Parse the input string and return the query and the value
// ex:
//
//	input: "$number - 1"
//	output: decrease number updated by 1
func parseCalculation(input string) (string, interface{}) {
	re := regexp.MustCompile(`(\w+)\s*([-+*/])\s*(\d+)`)
	matches := re.FindStringSubmatch(input)

	if len(matches) != 4 {
		return "", nil
	}

	column := matches[1]
	operator := matches[2]
	value, _ := strconv.Atoi(matches[3])

	query := fmt.Sprintf("%s %s ?", column, operator)
	return query, value
}

func BindSingularInput(template map[string]interface{}, input map[string]interface{}, savedData map[string]interface{}, userID string) map[string]interface{} {
	result := map[string]interface{}{}
	for k, v := range template {
		if res, ok := input[k].(string); ok {
			if strings.HasPrefix(res, "$") && v.(string) != "$user.id" {
				inputValue := strings.TrimPrefix(res, "$")
				key, value := parseCalculation(inputValue)
				result[k] = gorm.Expr(key, value)
				continue
			}
		}

		if strings.HasPrefix(v.(string), "$") {
			key := v.(string)[1:]
			if v == "$user.id" {
				result[k] = userID
			} else {
				result[k] = savedData[key]
			}
		} else if res, ok := input[k]; ok {
			result[k] = res
		}

	}

	return result
}

func BindMultipleInput(template map[string]interface{}, inputs []interface{}, savedData map[string]interface{}, userID string) []map[string]interface{} {
	result := []map[string]interface{}{}

	for _, input := range inputs {
		// currently testing, if broken, just change to the bottom one
		result = append(result, BindSingularInput(template, input.(map[string]interface{}), savedData, userID))

		/* ================================================================== */
		// current := map[string]interface{}{}
		// for k, v := range template {
		// 	if strings.HasPrefix(v.(string), "$") {
		// 		key := v.(string)[1:]
		// 		if v == "$user.id" {
		// 			current[k] = "[this_is_user_id]"
		// 		} else {
		// 			current[k] = savedData[key]
		// 		}
		// 	} else {
		// 		current[k] = input[k]
		// 	}
		// }
		// result = append(result, current)
	}

	return result
}
