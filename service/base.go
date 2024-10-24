package service

import (
	"funcbase/constants"

	"github.com/sarulabs/di"
)

type BaseService struct {
	ioc     di.Container
	Service *Service
}

func NewBaseService(ioc di.Container) *BaseService {
	return &BaseService{
		ioc: ioc,
	}
}

func (s *BaseService) WithService() *Service {
	return s.ioc.Get(constants.CONTAINER_SERVICE).(*Service)
}

type Service struct {
	DB      DBService
	Table   TableService
	Storage StorageService
	Backup  BackupService
}

func NewService(ioc di.Container) *Service {
	return &Service{
		DB:      NewDBService(ioc),
		Table:   NewTableService(ioc),
		Storage: NewStorageService(ioc),
		Backup:  NewBackupService(ioc),
	}
}
