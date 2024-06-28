package main

import (
	"strings"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Function struct {
	// name of the function
	Name string

	// action
	// insert || update || delete || fetch
	Action string
	Table  string

	// multiple
	// insert || update || delete
	Multiple bool

	// insert || update
	Values map[string]interface{}

	// update || delete || fetch
	// if empty will use id
	Filter map[string]interface{}

	// fetch
	Columns []string
}

type Caller struct {
	Data map[string]interface{}
}

func main() {

	functions := []Function{
		{
			Name:     "insert_transaction",
			Action:   "insert",
			Table:    "transactions",
			Multiple: false,
			Values: map[string]interface{}{
				"total_price": "number",
				"users":       "$user.id",
			},
		},
		{
			Name:     "update_products",
			Action:   "update",
			Table:    "products",
			Multiple: true,
			Values: map[string]interface{}{
				"id":  "string",
				"qty": "number",
			},
		},
		{
			Name:     "insert_transaction_items",
			Action:   "insert",
			Table:    "transaction_items",
			Multiple: true,
			Values: map[string]interface{}{
				"transaction_id": "$insert_transaction",
				"product_id":     "string",
				"price":          "number",
				"qty":            "number",
			},
		},
	}

	caller := Caller{
		Data: map[string]interface{}{
			"insert_transaction": map[string]interface{}{
				"total_price": 50000,
			},
			"update_products": []map[string]interface{}{
				{
					"id":  "PROD0001",
					"qty": 5,
				},
				{
					"id":  "PROD0002",
					"qty": 10,
				},
			},
			"insert_transaction_items": []map[string]interface{}{
				{
					"product_id": "PROD0001",
					"price":      5000,
					"qty":        5,
				},
				{
					"product_id": "PROD0002",
					"price":      2500,
					"qty":        10,
				},
			},
		},
	}

	db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		DryRun: true,
	})
	if err != nil {
		panic(err)
	}

	savedData := map[string]interface{}{}
	err = db.Transaction(func(db *gorm.DB) error {
		for _, f := range functions {
			switch f.Action {
			case "insert":
				if f.Multiple {
					bindedInput := BindMultipleInput(f.Values, caller.Data[f.Name].([]map[string]interface{}), savedData)
					err := db.Table(f.Table).Create(bindedInput).Error
					if err != nil {
						return err
					}
				} else {
					id := "fyea0f100i0askSF"
					bindedInput := BindSingularInput(f.Values, caller.Data[f.Name].(map[string]interface{}), savedData)
					err := db.Table(f.Table).Create(bindedInput).Error
					if err != nil {
						return err
					}
					savedData[f.Name] = id
				}
			case "update":
				if f.Multiple {
					for _, input := range caller.Data[f.Name].([]map[string]interface{}) {
						filter := map[string]interface{}{
							"id = ?": input["id"],
						}

						bindedInput := BindSingularInput(f.Values, input, savedData)
						table := db.Table(f.Table)
						for k, v := range filter {
							table = table.Where(k, v)
						}
						err := table.Updates(bindedInput).Error
						if err != nil {
							return err
						}
					}
				} else {
					data := caller.Data[f.Name].(map[string]interface{})
					filter := map[string]interface{}{
						"id = ?": data["id"],
					}

					bindedInput := BindSingularInput(f.Values, caller.Data[f.Name].(map[string]interface{}), savedData)
					table := db.Table(f.Table)
					for k, v := range filter {
						table = table.Where(k, v)
					}
					err := table.Updates(bindedInput).Error
					if err != nil {
						return err
					}
				}
			case "delete":
				if f.Multiple {
					for _, input := range caller.Data[f.Name].([]map[string]interface{}) {
						filter := map[string]interface{}{
							"id = ?": input["id"],
						}

						table := db.Table(f.Table)
						for k, v := range filter {
							table = table.Where(k, v)
						}
						err := table.Delete(nil).Error
						if err != nil {
							return err
						}
					}
				} else {
					data := caller.Data[f.Name].(map[string]interface{})
					filter := map[string]interface{}{
						"id = ?": data["id"],
					}

					table := db.Table(f.Table)
					for k, v := range filter {
						table = table.Where(k, v)
					}
					err := table.Delete(nil).Error
					if err != nil {
						return err
					}
				}
			case "fetch":
				result := []map[string]interface{}{}
				err := db.Table(f.Table).Select(f.Columns).Find(&result).Error
				if err != nil {
					return err
				}

				savedData[f.Name] = result
			}
		}

		return nil
	})
}

func BindSingularInput(template map[string]interface{}, input map[string]interface{}, savedData map[string]interface{}) map[string]interface{} {
	result := map[string]interface{}{
		"id": "fyea0f100i0askSF",
	}
	for k, v := range template {
		if strings.HasPrefix(v.(string), "$") {
			key := v.(string)[1:]
			if v == "$user.id" {
				result[k] = "[this_is_user_id]"
			} else {
				result[k] = savedData[key]
			}
		} else {
			result[k] = input[k]
		}

	}

	return result
}

func BindMultipleInput(template map[string]interface{}, inputs []map[string]interface{}, savedData map[string]interface{}) []map[string]interface{} {
	result := []map[string]interface{}{}

	for _, input := range inputs {
		current := map[string]interface{}{
			"id": "fyea0f100i0askSF",
		}
		for k, v := range template {
			if strings.HasPrefix(v.(string), "$") {
				key := v.(string)[1:]
				if v == "$user.id" {
					current[k] = "[this_is_user_id]"
				} else {
					current[k] = savedData[key]
				}
			} else {
				current[k] = input[k]
			}
		}
		result = append(result, current)
	}

	return result
}
