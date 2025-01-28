package config

import (
	"fmt"
	"os"
)

type Config struct {
	HTTPPort  string
	JWTSecret string
	// Можно добавить настройки для Asterisk, CRM и т.д.
	// AsteriskHost string
	// CRMApiURL    string
	// ...
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		HTTPPort:  getEnv("HTTP_PORT", "8080"),
		JWTSecret: getEnv("JWT_SECRET", "default_jwt_secret"),
	}

	if cfg.JWTSecret == "default_jwt_secret" {
		fmt.Println("Warning: using default JWT secret, please set JWT_SECRET in production.")
	}

	return cfg, nil
}

func getEnv(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}
