package config

var setDBConfig func()

func (d *DBMaxIdleConnection) OnUpdate() {
	SetDBConfig()
}

func (d *DBMaxOpenConnection) OnUpdate() {
	SetDBConfig()
}

func (d *DBMaxLifetime) OnUpdate() {
	SetDBConfig()
}

func SetDBConfigCallback(fn func()) {
	setDBConfig = fn
}

func SetDBConfig() {
	if setDBConfig != nil {
		setDBConfig()
	}
}
