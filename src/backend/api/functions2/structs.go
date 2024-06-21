package api_function_2

type Command struct {
	Action string                 `json:"action"`
	Table  string                 `json:"table"`
	Values map[string]interface{} `json:"values"`
	Filter map[string]interface{} `json:"filter,omitempty"`
}

type Function struct {
	ID      string  `json:"id"`
	Command Command `json:"command"`
}

type InputType struct {
	Type       string               `json:"type"`
	Properties map[string]InputType `json:"properties,omitempty"`
}
