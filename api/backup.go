package api

import (
	"fmt"
	"funcbase/constants"
	"funcbase/middleware"
	"funcbase/service"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type BackupAPI interface {
	Backup(c echo.Context) error
	DeleteBackup(c echo.Context) error
	Restore(c echo.Context) error
	FetchBackups(c echo.Context) error
}

type BackupAPIImpl struct {
	db      *gorm.DB
	service *service.Service
}

func NewBackupAPI(ioc di.Container) BackupAPI {
	return &BackupAPIImpl{
		db:      ioc.Get(constants.CONTAINER_DB).(*gorm.DB),
		service: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
	}
}

func (api *API) BackupAPI() {
	backupRouter := api.router.Group("/backup", middleware.ValidateMainAPIKey, middleware.RequireAuth(true))

	backupRouter.POST("/backup", api.Backup.Backup)
	backupRouter.POST("/restore/:filename", api.Backup.Restore)
	backupRouter.DELETE("/backup/:filename", api.Backup.DeleteBackup)
	backupRouter.GET("/backup", api.Backup.FetchBackups)
}

func (d *BackupAPIImpl) Backup(c echo.Context) error {
	err := d.service.Backup.Backup()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}

func (d *BackupAPIImpl) DeleteBackup(c echo.Context) error {
	filename := c.Param("filename")

	err := d.service.Backup.Delete(filename)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}

func (d *BackupAPIImpl) Restore(c echo.Context) error {
	filename := c.Param("filename")

	err := d.service.Backup.Restore(filename)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "success",
	})
}

func (d *BackupAPIImpl) FetchBackups(c echo.Context) error {
	backupPath := fmt.Sprintf("%s/%s", constants.DATA_PATH, constants.BACKUP_PATH)

	datas, err := os.ReadDir(backupPath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	filenames := []string{}
	for _, data := range datas {
		filenames = append(filenames, data.Name())
	}

	return c.JSON(http.StatusOK, filenames)
}
