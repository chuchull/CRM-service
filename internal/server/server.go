package server

import (
	"fmt"
	"net/http"

	"github.com/chuchull/CRM-service/internal/auth"
	"github.com/chuchull/CRM-service/internal/config"
	"github.com/gin-gonic/gin"
)

type Server struct {
	cfg    *config.Config
	engine *gin.Engine
}

func NewHTTPServer(cfg *config.Config) (*Server, error) {
	r := gin.Default()

	s := &Server{
		cfg:    cfg,
		engine: r,
	}

	// Настраиваем роуты
	s.setupRoutes()

	return s, nil
}

func (s *Server) setupRoutes() {
	// Публичные роуты
	s.engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Маршрут для логина (возврат JWT)
	s.engine.POST("/login", s.loginHandler)

	// Группа защищённых роутов
	authGroup := s.engine.Group("/api", s.AuthMiddleware())
	{
		// Пример: получить JSON шаблон для UI
		authGroup.GET("/templates", s.getUserTemplate)
	}
}

func (s *Server) Run() error {
	addr := fmt.Sprintf(":%s", s.cfg.HTTPPort)
	return s.engine.Run(addr)
}

// loginHandler - принимает {username, password}, проверяет, возвращает JWT
func (s *Server) loginHandler(c *gin.Context) {
	var loginData auth.LoginData
	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if !auth.CheckUserCredentials(loginData.Username, loginData.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := auth.GenerateJWT(loginData.Username, s.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}
