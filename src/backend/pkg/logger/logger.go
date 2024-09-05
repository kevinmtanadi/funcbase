package pkg_logger

import (
	"bufio"
	"encoding/json"
	"os"
	"sync"
	"time"
)

type APILog struct {
	Endpoint  string    `json:"endpoint" gorm:"column:endpoint"`
	Status    int       `json:"status"`
	Host      string    `json:"host"`
	Method    string    `json:"method"`
	ExecTime  string    `json:"exec_time"`
	Error     error     `json:"error"`
	CreatedAt time.Time `json:"created_at"`
}

var (
	Logs     []APILog
	logMutex = &sync.Mutex{}
)

func LoadLogs() error {
	logFile := os.Getenv("LOG_PATH")

	file, err := os.Open(logFile)
	if err != nil {
		if os.IsNotExist(err) {
			file, err = os.Create(logFile)
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		var log APILog
		if err := json.Unmarshal(scanner.Bytes(), &log); err == nil {
			Logs = append(Logs, log)
		}
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	return nil
}

// Append a log to the file and in-memory storage
func AppendLog(log APILog) error {
	logFile := os.Getenv("LOG_PATH")

	logMutex.Lock()
	defer logMutex.Unlock()

	// Add log to in-memory storage
	Logs = append(Logs, log)

	// Append log to the log file
	file, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	logData, err := json.Marshal(log)
	if err != nil {
		return err
	}

	file.WriteString(string(logData) + "\n")
	return nil
}
