package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
)

func main() {
	godotenv.Load(".env")

	app := echo.New()

	module := Module{}
	module.New(app)

	// Serve the built static files
	currentDir, _ := filepath.Abs(filepath.Dir(os.Args[0]))
	distDir := filepath.Join(currentDir, "dist")
	app.Static("/", distDir)
	app.File("", distDir+"/index.html")

	API(app)

	port := "8080"
	app.Logger.Fatal(app.Start(fmt.Sprintf(":%s", port)))
}

func API(app *echo.Echo) {
	api := app.Group("/api")
	api.GET("/hello", HelloWorld)
}

func HelloWorld(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"message": "Hello World!"})
}
