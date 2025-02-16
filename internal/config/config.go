package config

import (
	"os"
)

type Config struct {
	HTTPPort  string
	JWTSecret string

	CRMApiKey string
	CRMUrl    string
	CRMAuth   string
	CRMlogin  string
	CRMpasswd string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		HTTPPort:  getEnv("HTTP_PORT", ""),
		JWTSecret: getEnv("JWT_SECRET", ""),

		CRMApiKey: getEnv("CRM_API_KEY", ""),
		CRMUrl:    getEnv("CRM_URL", ""),
		CRMAuth:   getEnv("Authorization", ""),
		CRMlogin:  getEnv("userName", ""),
		CRMpasswd: getEnv("password", ""),
	}
	return cfg, nil
}

func getEnv(key, defVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defVal
}
