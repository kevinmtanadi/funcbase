package config

func (cron *CronSchedule) OnUpdate() {
	RestartCron()
}

var restartCronFunc func()

func SetRestartCronCallback(fn func()) {
	restartCronFunc = fn
}

func RestartCron() {
	if restartCronFunc != nil {
		restartCronFunc()
	}
}
