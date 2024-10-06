package main

import (
	"embed"
	"fmt"
	"funcbase/config"
	"funcbase/constants"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
)

func generateRequiredPaths() {
	dir := constants.DATA_PATH

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.MkdirAll(dir, 0755)
	}

	// CREATE DIRECTORY
	storageDir := fmt.Sprintf("%s/%s", dir, constants.STORAGE_PATH)
	if _, err := os.Stat(storageDir); os.IsNotExist(err) {
		os.MkdirAll(storageDir, os.ModePerm)
	}

	backupDir := fmt.Sprintf("%s/%s", dir, constants.BACKUP_PATH)
	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		os.MkdirAll(backupDir, os.ModePerm)
	}

	// CREATE FILE
	dbDir := fmt.Sprintf("%s/%s", dir, constants.DB_PATH)
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		os.Create(dbDir)
	}

	configDir := fmt.Sprintf("%s/%s", dir, constants.CONFIG_PATH)
	if _, err := os.Stat(configDir); os.IsNotExist(err) {
		os.Create(configDir)
	}
}

func main() {
	godotenv.Load(".env")
	generateRequiredPaths()

	config := config.GetInstance()
	config.Load()

	app := echo.New()

	module := Module{}
	module.New(app)

	ServeStaticUI(app)

	port := "8080"
	app.Logger.Fatal(app.Start(fmt.Sprintf(":%s", port)))
}

//go:embed dist/*
var distFS embed.FS

// Serve the built static files
func ServeStaticUI(app *echo.Echo) {
	distDirFS := echo.MustSubFS(distFS, "dist")
	distIndexHtml := echo.MustSubFS(distFS, "dist")
	app.FileFS("/", "index.html", distIndexHtml)
	app.FileFS("/signup", "index.html", distIndexHtml)
	app.FileFS("/signin", "index.html", distIndexHtml)
	app.FileFS("/sql", "index.html", distIndexHtml)
	app.FileFS("/setting", "index.html", distIndexHtml)
	app.FileFS("/admin", "index.html", distIndexHtml)
	app.FileFS("/function", "index.html", distIndexHtml)
	app.FileFS("/function/create", "index.html", distIndexHtml)
	app.FileFS("/storage", "index.html", distIndexHtml)
	app.StaticFS("/", distDirFS)
}
