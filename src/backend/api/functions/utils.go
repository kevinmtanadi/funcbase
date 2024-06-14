package api_function

import (
	"encoding/json"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// TODO: IS VERY BROKEN, NEED TO FIX
func applyFilter(query *gorm.DB, filter map[string]interface{}) *gorm.DB {
	for key, value := range filter {
		switch strings.ToLower(key) {
		case "and":
			for _, condition := range value.([]interface{}) {
				query = applyFilter(query, condition.(map[string]interface{}))
			}
		case "or":
			query = query.Where(func(tx *gorm.DB) *gorm.DB {
				ors := value.([]interface{})

				tx = applyFilter(tx, ors[0].(map[string]interface{}))
				for _, condition := range ors[1:] {
					for k, v := range condition.(map[string]interface{}) {
						tx = Or(query, k, v)
					}
				}

				return tx
			}(query))

			return query
		default:
			return Where(query, key, value)
		}
	}
	return query
}

func Where(query *gorm.DB, key string, value interface{}) *gorm.DB {
	return query.Where(fmt.Sprintf("%s = ?", key), value)
}

func Or(query *gorm.DB, key string, value interface{}) *gorm.DB {
	return query.Or(fmt.Sprintf("%s = ?", key), value)
}

func mapToStruct(data map[string]interface{}, result interface{}) error {
	bytes, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return json.Unmarshal(bytes, result)
}
