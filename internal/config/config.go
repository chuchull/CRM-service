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
		HTTPPort:  getEnv("HTTP_PORT", "8080"),
		JWTSecret: getEnv("JWT_SECRET", "default_secret"),

		CRMApiKey: getEnv("CRM_API_KEY", "ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5"),
		CRMUrl:    getEnv("CRM_URL", "http://127.0.0.1:8000/webservice/WebserviceStandard/"),
		CRMAuth:   getEnv("Authorization", "Basic dGVzdDoxMjM0NTY3ODk="),
		CRMlogin:  getEnv("userName", "crm@api.com"),
		CRMpasswd: getEnv("password", "CRMapi1234#"),
	}
	return cfg, nil
}

func getEnv(key, defVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defVal
}
