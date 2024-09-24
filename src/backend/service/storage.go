package service

import (
	"io"
	"os"
	"react-golang/src/backend/constants"

	"github.com/sarulabs/di"
	"gorm.io/gorm"
)

type StorageService interface {
	Get(directory string, writer io.Writer) error
	Save(file io.Reader, directory string) error
	Delete(directory string) error
}

type StorageServiceImpl struct {
	service *BaseService
	db      *gorm.DB
}

func NewStorageService(ioc di.Container) StorageService {
	return &StorageServiceImpl{
		service: NewBaseService(ioc),
		db:      ioc.Get(constants.CONTAINER_DB_NAME).(*gorm.DB),
	}
}

func (s *StorageServiceImpl) Get(directory string, writer io.Writer) error {
	file, err := os.Open(directory)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = io.Copy(writer, file)
	if err != nil {
		return err
	}

	return nil
}

func (s *StorageServiceImpl) Save(file io.Reader, directory string) error {
	// check if file already exist
	_, err := os.Stat(directory)
	if os.IsExist(err) {
		os.Remove(directory)
	}

	dst, err := os.Create(directory)
	if err != nil {
		return err
	}
	defer dst.Close()

	// Copy file to destination
	if _, err := io.Copy(dst, file); err != nil {
		return err
	}

	return nil
}

func (s *StorageServiceImpl) Delete(directory string) error {
	return os.Remove(directory)
}
