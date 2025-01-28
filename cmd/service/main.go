// cmd/service/main.go
package main

import (
	"log"

	"github.com/chuchull/CRM-service/internal/config"
	"github.com/chuchull/CRM-service/internal/server"
)

func main() {
	// 1. Загружаем конфигурацию (включая JWT secret)
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	// 2. Инициализируем сервер
	srv, err := server.NewHTTPServer(cfg)
	if err != nil {
		log.Fatalf("Error initializing server: %v", err)
	}

	// 3. Запускаем
	if err := srv.Run(); err != nil {
		log.Fatalf("Server crashed: %v", err)
	}
}
