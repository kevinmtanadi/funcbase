package main

import (
	"fmt"
	"funcbase/config"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/log"
)

func main() {
	godotenv.Load(".env")

	config := config.GetInstance()
	config.Load()

	app := echo.New()

	app.Logger.SetLevel(log.OFF)

	module := Module{}
	module.New(app)

	// Serve the built static files
	distDir := "dist"

	fmt.Println(distDir)
	app.Static("/", distDir)
	app.Static("/signup", distDir)
	app.Static("/signin", distDir)
	app.Static("/sql", distDir)
	app.Static("/setting", distDir)
	app.Static("/admin", distDir)
	app.Static("/function", distDir)
	app.Static("/function/create", distDir)
	app.Static("/storage", distDir)
	app.File("", distDir+"/index.html")

	port := "8080"
	app.Logger.Fatal(app.Start(fmt.Sprintf(":%s", port)))
}
