package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

func main() {
	app := echo.New()

	app.GET("/hello", HelloWorld)

	port := "8080"
	app.Logger.Fatal(app.Start(fmt.Sprintf(":%s", port)))
}

func HelloWorld(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"message": "Hello World!"})
}
