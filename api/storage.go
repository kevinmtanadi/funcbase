package api

import (
	"fmt"
	"funcbase/constants"
	"funcbase/middleware"
	"funcbase/service"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
)

type StorageAPI interface {
	FetchStorageData(c echo.Context) error
	Retrieve(c echo.Context) error
	Upload(c echo.Context) error
	Delete(c echo.Context) error
}

type StorageAPIImpl struct {
	service *service.Service
}

func NewStorageAPI(ioc di.Container) StorageAPI {
	return &StorageAPIImpl{
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
	}
}

func (api *API) StorageAPI() {
	storageRouter := api.router.Group("/storage")

	storageRouter.GET("", api.Storage.FetchStorageData, middleware.ValidateMainAPIKey)
	storageRouter.GET("/:filename", api.Storage.Retrieve)
	storageRouter.POST("/upload", api.Storage.Upload, middleware.ValidateAPIKey)
	storageRouter.DELETE("/:filename", api.Storage.Delete, middleware.ValidateMainAPIKey)
}

type fetchStorageDataReq struct {
	Search   string `query:"search"`
	Page     int    `query:"page"`
	PageSize int    `query:"page_size"`
}

type file struct {
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
	Type     string `json:"type"`
}

type fetchStorageDataRes struct {
	Files      []file `json:"files"`
	Page       int    `json:"page"`
	PageSize   int    `json:"page_size"`
	TotalFiles int    `json:"total_files"`
}

var storagePath string = fmt.Sprintf("%s/%s", constants.DATA_PATH, constants.STORAGE_PATH)

func (s *StorageAPIImpl) FetchStorageData(c echo.Context) error {
	var params *fetchStorageDataReq = new(fetchStorageDataReq)
	if err := (&echo.DefaultBinder{}).BindQueryParams(c, params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 100
	}

	// Calculate the offset and limit
	offset := (params.Page - 1) * params.PageSize
	limit := params.PageSize

	var result []file

	datas, err := os.ReadDir(storagePath)
	totalFiles := len(datas)
	start := offset
	end := offset + limit

	if start > totalFiles {
		start = totalFiles
	}
	if end > totalFiles {
		end = totalFiles
	}

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	for _, data := range datas[start:end] {
		if params.Search != "" && !strings.Contains(data.Name(), params.Search) {
			continue
		}

		fi, _ := os.Stat(filepath.Join(storagePath, data.Name()))

		file := file{
			Filename: data.Name(),
			Size:     fi.Size(),
			Type:     filepath.Ext(data.Name()),
		}

		result = append(result, file)
	}

	return c.JSON(http.StatusOK, fetchStorageDataRes{
		Files:      result,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalFiles: totalFiles,
	})
}

func (s *StorageAPIImpl) Retrieve(c echo.Context) error {
	filename := c.Param("filename")

	dir := filepath.Join(storagePath, filename)
	err := s.service.Storage.Get(dir, c.Response().Writer)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}

func (s *StorageAPIImpl) Upload(c echo.Context) error {
	err := c.Request().ParseMultipartForm(32 << 20) // 32 MB max
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": "Failed to parse multipart form",
		})
	}

	form := c.Request().MultipartForm

	for _, files := range form.File {
		file, err := files[0].Open()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": "Failed to open file",
			})
		}

		defer file.Close()

		storageDir := filepath.Join(storagePath, files[0].Filename)
		err = s.service.Storage.Save(file, storageDir)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}

func (s *StorageAPIImpl) Delete(c echo.Context) error {
	filename := c.Param("filename")
	directory := filepath.Join(storagePath, filename)

	err := s.service.Storage.Delete(directory)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}
