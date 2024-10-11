package service

import (
	"fmt"
	"funcbase/constants"
	pkg_backup "funcbase/pkg/backup"
	"os"

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
		db: ioc.Get(constants.CONTAINER_DB).(*gorm.DB),
	}
}

var dbPath string = fmt.Sprintf("%s/%s", constants.DATA_PATH, constants.DB_PATH)
var backupPath string = fmt.Sprintf("%s/%s", constants.DATA_PATH, constants.BACKUP_PATH)

func (s *BackupServiceImpl) Backup() error {
	err := pkg_backup.Backup(dbPath, backupPath)
	if err != nil {
		return err
	}
	return nil
}

func (s *BackupServiceImpl) Restore(filename string) error {
	err := pkg_backup.Restore(filename, dbPath)
	if err != nil {
		return err
	}
	return nil
}

func (s *BackupServiceImpl) Delete(filename string) error {
	fileDirectory := fmt.Sprintf("%s/%s", backupPath, filename)

	err := os.Remove(fileDirectory)
	if err != nil {
		return err
	}

	return nil
}
