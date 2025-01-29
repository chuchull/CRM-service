package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

var Log = logrus.New()
var logFile *os.File // чтобы потом закрыть при завершении

// InitLogger инициализирует логгер и настраивает запись в файл
func InitLogger(filename string) error {
	var err error
	logFile, err = os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return err
	}

	// Настраиваем logrus
	Log.SetOutput(logFile)
	Log.SetLevel(logrus.InfoLevel)
	Log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	// Если хотите JSON-формат:
	// Log.SetFormatter(&logrus.JSONFormatter{})

	return nil
}

// CloseLogger закрывает файл лога
func CloseLogger() {
	if logFile != nil {
		logFile.Close()
	}
}
