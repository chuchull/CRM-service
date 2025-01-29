package config

import (
	"fmt"
	"os"
)

type Config struct {
	HTTPPort  string
	JWTSecret string

	CRMApiKey string
	CRMUrl    string
	CRMAuth   string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		HTTPPort:  getEnv("HTTP_PORT", "8080"),
		JWTSecret: getEnv("JWT_SECRET", "default_secret"),

		CRMApiKey: getEnv("CRM_API_KEY", "ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5"),
		CRMUrl:    getEnv("CRM_URL", "http://127.0.0.1:8000/webservice/WebserviceStandard/Users/Login"),
		CRMAuth:   getEnv("Authorization", "Basic dGVzdDoxMjM0NTY3ODk="),
	}

	// Можно добавить проверки
	if cfg.JWTSecret == "default_secret" {
		fmt.Println("Warning: using default JWT secret. Set JWT_SECRET in production.")
	}

	return cfg, nil
}

func getEnv(key, defVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defVal
}
