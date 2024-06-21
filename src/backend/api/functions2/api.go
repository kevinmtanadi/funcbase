package api_function_2

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"react-golang/src/backend/constants"
	"react-golang/src/backend/utils"
	"reflect"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type Function2API interface {
	RunFunction(c echo.Context) error
}

type Function2APIImpl struct {
	db *gorm.DB
}

func NewFunctionAPI(ioc di.Container) Function2API {
	return Function2APIImpl{
		db: ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
	}
}

type storedFunction struct {
	Inputs    map[string]InputType `json:"inputs"`
	Functions []Function           `json:"functions"`
}

type runFunctionReq struct {
	Input map[string]interface{} `json:"input"`
}

func (h Function2APIImpl) RunFunction(c echo.Context) error {

	jsonData := `{
    "inputs": {
        "total_price": {
            "type": "number"
        },
        "products": {
            "type": "array_object",
            "properties": {
                "id": {
                    "type": "string"
                },
                "qty": {
                    "type": "number"
                },
                "price": {
                    "type": "number"
                }
            }
        }
    },
    "functions": [
        {   
            "id": "insert_transaction",
            "command": {
                "action": "insert",
                "table": "transactions",
                "values": {
                    "total_price": "$total_price"
                }
            }
        },
        {
            "id": "update_products",
            "command": {
                "action": "update",
                "table": "products",
                "values": {
                    "id": "$products.id",
                    "qty": "$products.qty",
                    "price": "$products.price"
                },
                "filter": {
                    "id": "$products.id"
                }
            }
        },
        {
            "id": "insert_transaction_items",
            "command": {
                "action": "insert",
                "table": "transaction_items",
                "values": {
                    "transaction_id": "#insert_transaction.id",
                    "item_id": "$products.id",
                    "qty": "$products.qty",
                    "price": "$products.price"
                }
            }
        }
        
    ]
}


	`

	var body *storedFunction = new(storedFunction)
	err := json.Unmarshal([]byte(jsonData), body)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	var input *runFunctionReq = new(runFunctionReq)
	err = c.Bind(input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	err = validateInput(body.Inputs, input.Input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	result := map[string]interface{}{}
	for _, f := range body.Functions {
		switch f.Command.Action {
		case "insert":
			id, _ := utils.GenerateRandomString(16)
			f.Command.Values["id"] = id
			result[f.ID+"_id"] = id

		case "update":
			// updatedData := parseInputs(input.Input, f.Command.Values)
			// fmt.Println(updatedData)
		default:
			return c.JSON(http.StatusBadRequest, map[string]interface{}{
				"error": "invalid action type",
			})
		}
	}

	return c.JSON(http.StatusOK, body)
}

var datatypeMap map[string]string = map[string]string{
	"int64":                     "number",
	"int32":                     "number",
	"int":                       "number",
	"float64":                   "number",
	"float32":                   "number",
	"float":                     "number",
	"string":                    "string",
	"bool":                      "bool",
	"interface{}":               "object",
	"interface {}":              "object",
	"map[string]interface{}":    "object",
	"map[string]interface {}":   "object",
	"[]int64":                   "array_number",
	"[]int32":                   "array_number",
	"[]int":                     "array_number",
	"[]float64":                 "array_number",
	"[]float32":                 "array_number",
	"[]float":                   "array_number",
	"[]string":                  "array_string",
	"[]interface{}":             "array_object",
	"[]interface {}":            "array_object",
	"[]map[string]interface{}":  "array_object",
	"[]map[string]interface {}": "array_object",
	"[]bool":                    "array_bool",
}

func validateInput(template map[string]InputType, data map[string]interface{}) error {

	for k, v := range template {
		if data[k] == nil {
			return fmt.Errorf("data with key [%s] not found", k)
		}

		datatype := reflect.TypeOf(data[k]).String()
		if datatypeMap[datatype] != v.Type {
			return fmt.Errorf("data with key [%s] has data of type [%s], expected [%s]", k, datatypeMap[datatype], v.Type)
		}

		if v.Type == "object" {
			err := validateInput(v.Properties, data[k].(map[string]interface{}))
			if err != nil {
				return errors.New(err.Error() + " on [" + k + "]")
			}
		}

		if v.Type == "array_object" {
			arrData := data[k].([]interface{})
			for i, d := range arrData {
				err := validateInput(v.Properties, d.(map[string]interface{}))
				if err != nil {
					return errors.New(err.Error() + " on [" + k + "] #" + strconv.Itoa(i))
				}
			}
		}

		if v.Type == "array_number" {
			dtype := reflect.TypeOf(data[k]).String()
			if datatypeMap[dtype] != "array_number" {
				return fmt.Errorf("data with key [%s] has data of type [%s], expected [%s]", k, dtype, "array_number")
			}
		}

		if v.Type == "array_string" {
			dtype := reflect.TypeOf(data[k]).String()
			if datatypeMap[dtype] != "array_string" {
				return fmt.Errorf("data with key [%s] has data of type [%s], expected [%s]", k, dtype, "array_string")
			}
		}

		if v.Type == "array_bool" {
			dtype := reflect.TypeOf(data[k]).String()
			if datatypeMap[dtype] != "array_bool" {
				return fmt.Errorf("data with key [%s] has data of type [%s], expected [%s]", k, dtype, "array_bool")
			}
		}
	}

	return nil
}
