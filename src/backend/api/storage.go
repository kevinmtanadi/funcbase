package api

import (
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type StorageAPI interface {
	Retrieve(c echo.Context) error
}

type StorageAPIImpl struct {
}

func NewStorageAPI(ioc di.Container) StorageAPI {
	return &StorageAPIImpl{}
}

func (s *StorageAPIImpl) Retrieve(c echo.Context) error {
	filename := c.Param("filename")

	dir := filepath.Join("..", "public", filename)
	file, err := os.Open(dir)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	defer file.Close()

	_, err = io.Copy(c.Response().Writer, file)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Just placeholder",
	})
}
