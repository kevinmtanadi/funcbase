package main

import (
	"funcbase/config"
	"funcbase/constants"
	"funcbase/pkg/logger"
	"funcbase/service"

	"github.com/robfig/cron/v3"
	"github.com/sarulabs/di"
)

type Batch struct {
	services *service.Service
	configs  *config.Config
	cron     *cron.Cron
}

var BatchRunner *Batch

func RunBatch(ioc di.Container) {
	BatchRunner = &Batch{
		services: ioc.Get(constants.CONTAINER_SERVICE).(*service.Service),
		configs:  config.GetInstance(),
		cron:     cron.New(),
	}

	config.SetRestartCronCallback(RestartCronCallback)
	BatchRunner.startCron()
}

func (b *Batch) startCron() {
	if b.configs.AutomatedBackup {
		b.cron.AddFunc(b.configs.GetCronSchedule(), func() {
			b.services.Backup.Backup()
		})
	}

	b.cron.AddFunc("0 */4 * * *", func() {
		logger.DeleteOldLog()
	})

	go func() {
		b.cron.Start()
		defer b.cron.Stop()
		select {}
	}()
}

func RestartCronCallback() {
	BatchRunner.cron.Stop()
	BatchRunner.cron = cron.New()
	BatchRunner.startCron()
}
