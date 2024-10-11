package responses

type APIResponse struct {
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
	Error   interface{} `json:"error"`
}

func NewResponse(data interface{}, message string, err interface{}) APIResponse {
	return APIResponse{
		Data:    data,
		Message: message,
		Error:   err,
	}
}
