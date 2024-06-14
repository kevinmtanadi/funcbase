package api_function

import (
	"errors"
	"fmt"
	"net/http"
	"react-golang/src/backend/constants"
	"react-golang/src/backend/utils"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
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

func (f FunctionAPIImpl) RunFunction(c echo.Context) error {
	var body *runFunctionReq = new(runFunctionReq)
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, errors.New("Failed to bind: "+err.Error()))
	}

	err := f.userDb.Transaction(func(tx *gorm.DB) error {
		for _, command := range body.Commands {
			for actionType, cmd := range command {
				switch actionType {
				case "insert":
					id, _ := utils.GenerateRandomString(16)
					var insert Insert
					err := mapToStruct(cmd, &insert)
					if err != nil {
						return err
					}

					insert.Data["id"] = id
					table := tx.Table(insert.Table)
					result := table.Create(insert.Data)
					if result.Error != nil {
						return result.Error
					}

					if insert.Children.Table != "" && len(insert.Children.Data) > 0 {
						childrenId, _ := utils.GenerateRandomString(16)
						for i, data := range insert.Children.Data {
							data[insert.Table] = id
							insert.Children.Data[i]["id"] = childrenId
						}

						childrenTable := tx.Table(insert.Children.Table)
						result = childrenTable.Create(insert.Children.Data)
						if result.Error != nil {
							return result.Error
						}
					}
				case "update":
					var update Update
					err := mapToStruct(cmd, &update)
					if err != nil {
						return err
					}

					fmt.Println(update.Filter)
					table := tx.Table(update.Table)
					result := applyFilter(table, update.Filter).Updates(update.Data)
					if result.Error != nil {
						return result.Error
					}
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

	return c.JSON(http.StatusOK, nil)
}
