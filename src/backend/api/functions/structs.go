package api_function

type Insert struct {
	Table    string                 `json:"table"`
	Data     map[string]interface{} `json:"data"`
	Children Children               `json:"children"`
}

type Children struct {
	Table string                   `json:"table"`
	Data  []map[string]interface{} `json:"data"`
}

// type Filter struct {
// 	Operator   string   `json:"operator"`
// 	Conditions []Filter `json:"conditions"`
// 	Column     string   `json:"column"`
// 	Operation  string   `json:"operation"`
// 	Value      string   `json:"value"`
// }

type Update struct {
	Table  string                 `json:"table"`
	Filter map[string]interface{}                 `json:"filter"`
	Data   map[string]interface{} `json:"data"`
}

type Command map[string]map[string]interface{}

type runFunctionReq struct {
	Commands []Command `json:"commands"`
}
