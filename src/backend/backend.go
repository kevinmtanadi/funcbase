package main

import (
	"fmt"
	"os"
	"path/filepath"
	"react-golang/src/backend/config"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
)

func main() {
	godotenv.Load(".env")

	config := config.GetInstance()
	config.Load()

	app := echo.New()

	module := Module{}
	module.New(app)

	// Serve the built static files
	currentDir, _ := filepath.Abs(filepath.Dir(os.Args[0]))
	distDir := filepath.Join(currentDir, "dist")
	app.Static("/", distDir)
	app.Static("/signup", distDir)
	app.Static("/signin", distDir)
	app.Static("/sql", distDir)
	app.Static("/setting", distDir)
	app.Static("/admin", distDir)
	app.File("", distDir+"/index.html")

	port := "8080"
	app.Logger.Fatal(app.Start(fmt.Sprintf(":%s", port)))
}
