package main

import (
	"log"

	"github.com/chuchull/CRM-service/internal/config"
	"github.com/chuchull/CRM-service/internal/crm"
	"github.com/chuchull/CRM-service/internal/logger"
	"github.com/chuchull/CRM-service/internal/server"
	"github.com/joho/godotenv"
)

func main() {
	// Загрузка .env файла
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Ошибка загрузки .env файла")
	}

	// 1. Загружаем конфигурацию
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	// 2. Инициализируем логгер
	err = logger.InitLogger("logs/app.log") // пишем логи в файл logs/app.log
	if err != nil {
		log.Fatalf("Cannot init logger: %v", err)
	}
	defer logger.CloseLogger()

	logger.Log.Info("Logger initialized successfully...")

	// 3. Инициализируем CRM
	crm.InitCRM(cfg)

	// 4. Запускаем сервер
	srv, err := server.NewHTTPServer(cfg)
	if err != nil {
		logger.Log.Fatalf("Error initializing server: %v", err)
	}

	logger.Log.Info("Starting HTTP Server...")
	if err := srv.Run(); err != nil {
		logger.Log.Fatalf("Server crashed: %v", err)
	}
}
