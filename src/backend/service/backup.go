package service

import (
	"fmt"
	"os"
	"react-golang/src/backend/constants"
	pkg_backup "react-golang/src/backend/pkg/backup"

	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type BackupService interface {
	Backup() error
	Restore(filename string) error
	Delete(filename string) error
}

type BackupServiceImpl struct {
	db *gorm.DB
}

func NewBackupService(ioc di.Container) BackupService {
	return &BackupServiceImpl{
		db: ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
	}
}

func (s *BackupServiceImpl) Backup() error {
	err := pkg_backup.Backup(os.Getenv("DB_PATH"), os.Getenv("BACKUP_PATH"))
	if err != nil {
		return err
	}
	return nil
}

func (s *BackupServiceImpl) Restore(filename string) error {
	err := pkg_backup.Restore(filename, os.Getenv("DB_PATH"))
	if err != nil {
		return err
	}
	return nil
}

func (s *BackupServiceImpl) Delete(filename string) error {
	fileDirectory := fmt.Sprintf("%s/%s", os.Getenv("BACKUP_PATH"), filename)

	err := os.Remove(fileDirectory)
	if err != nil {
		return err
	}

	return nil
}
