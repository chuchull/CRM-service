package server

import (
	"net/http"

	"github.com/chuchull/CRM-service/internal/logger"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware проверяет лишь присутствие X-TOKEN заголовка
func (s *Server) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		crmToken := c.GetHeader("X-TOKEN")
		if crmToken == "" {
			logger.Log.Warn("No X-TOKEN header, unauthorized")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing crm token"})
			return
		}

		// Опционально: мы можем сделать вызов CRM, чтобы проверить, не просрочен ли токен
		// например, crm.ValidateTokenCRM(crmToken) -> bool
		// если expired => 401
		// (Но если CRM не предоставляет «метод валидации», тогда просто передаём дальше)

		// Сохраняем crmToken в контексте для дальнейшего использования
		c.Set("crmToken", crmToken)
		c.Next()
	}
}

// CORSMiddleware добавляет необходимые заголовки для CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Authorization, X-TOKEN")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
