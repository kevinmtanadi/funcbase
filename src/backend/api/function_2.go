package api

import (
	"errors"
	"fmt"
	"net/http"
	"react-golang/src/backend/constants"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FunctionAPI interface {
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

type Command struct {
	Type   string                 `json:"type"`
	Table  string                 `json:"table"`
	Data   map[string]interface{} `json:"data"`
	Filter Filter                 `json:"filter,omitempty"`
}

type runFunctionReq struct {
	Commands []Command `json:"commands"`
}

func (f FunctionAPIImpl) RunFunction(c echo.Context) error {
	var body *runFunctionReq = new(runFunctionReq)
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, errors.New("Failed to bind: "+err.Error()))
	}

	err := f.userDb.Transaction(func(tx *gorm.DB) error {
		for _, command := range body.Commands {
			table := command.Table
			switch command.Type {
			case "insert":
				result := tx.Table(table).Create(command.Data)
				if result.Error != nil {
					fmt.Println("1", result.Error.Error())
					return result.Error
				}
			case "update":
				filteredTable := parseFilter(tx.Table(table), command.Filter)
				result := filteredTable.
					Updates(command.Data)
				if result.Error != nil {
					return result.Error
				}
			default:
				return errors.New("Unknown command type: " + command.Type)
			}
		}

		return nil
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": "Failed to run function: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, nil)
}

type Filter struct {
	And    []Condition `json:"and,omitempty"`
	Or     []Condition `json:"or,omitempty"`
	Direct Condition   `json:"direct,omitempty"`
}

type Condition map[string]interface{}

func parseFilter(db *gorm.DB, filter Filter) *gorm.DB {
	andConditions := []clause.Expression{}
	orConditions := []clause.Expression{}

	if len(filter.And) > 0 {
		for _, cond := range filter.And {
			andConditions = append(andConditions, parseCondition(cond))
		}
	}

	if len(filter.Or) > 0 {
		for _, cond := range filter.Or {
			orConditions = append(orConditions, parseCondition(cond))
		}
	}

	if len(andConditions) > 0 {
		db = db.Clauses(clause.And(andConditions...))
	}

	if len(orConditions) > 0 {
		db = db.Clauses(clause.Or(orConditions...))
	}

	if len(filter.Direct) > 0 {
		db = db.Clauses(parseCondition(filter.Direct))
	}

	return db
}

func parseCondition(cond Condition) clause.Expression {
	andConditions := []clause.Expression{}
	for key, value := range cond {
		switch key {
		case "and":
			conditions := value.([]interface{})
			for _, c := range conditions {
				andConditions = append(andConditions, parseCondition(c.(map[string]interface{})))
			}
			return clause.And(andConditions...)
		case "or":
			conditions := value.([]interface{})
			orConditions := []clause.Expression{}
			for _, c := range conditions {
				orConditions = append(orConditions, parseCondition(c.(map[string]interface{})))
			}
			return clause.Or(orConditions...)
		default:
			return clause.Eq{Column: key, Value: value}
		}
	}
	return nil
}
