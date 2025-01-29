package server

import (
	"fmt"
	"net/http"

	"github.com/chuchull/CRM-service/internal/auth"
	"github.com/chuchull/CRM-service/internal/config"
	"github.com/chuchull/CRM-service/internal/crm"
	"github.com/chuchull/CRM-service/internal/logger"
	"github.com/gin-gonic/gin"
)

type Server struct {
	cfg    *config.Config
	engine *gin.Engine
}

func NewHTTPServer(cfg *config.Config) (*Server, error) {
	r := gin.Default()
	s := &Server{cfg: cfg, engine: r}
	s.setupRoutes()
	return s, nil
}

func (s *Server) setupRoutes() {
	s.engine.GET("/health", s.healthHandler)
	s.engine.POST("/login", s.loginHandler)

	api := s.engine.Group("/api", s.AuthMiddleware())
	{
		api.GET("/templates", s.getUserTemplate)
	}
}

func (s *Server) Run() error {
	addr := fmt.Sprintf(":%s", s.cfg.HTTPPort)
	return s.engine.Run(addr)
}

// Пример проверки
func (s *Server) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// loginHandler - принимает логин/пароль, идёт в CRM, при успехе выдаёт локальный JWT
func (s *Server) loginHandler(c *gin.Context) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Log.Errorf("Login handler: invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// Логинимся в CRM
	userResult, err := crm.LoginCRM(body.Username, body.Password, s.cfg.CRMApiKey, s.cfg.CRMUrl)
	if err != nil {
		logger.Log.Warnf("CRM login failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Успех — выдаём JWT
	jwtToken, err := auth.GenerateJWT(body.Username, s.cfg.JWTSecret)
	if err != nil {
		logger.Log.Errorf("Error generating JWT: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	logger.Log.Infof("User %s successfully logged in via CRM, local JWT issued.", body.Username)
	c.JSON(http.StatusOK, gin.H{
		"jwt":      jwtToken,
		"crmToken": userResult.Token, // возможно, понадобится на фронте
		"name":     userResult.Name,
	})
}
