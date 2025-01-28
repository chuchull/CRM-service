package server

import (
	"net/http"
	"strings"

	"github.com/chuchull/CRM-service/internal/auth"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware - проверяет наличие и валидность JWT в заголовке Authorization
func (s *Server) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid auth header format"})
			return
		}

		tokenStr := parts[1]
		claims, err := auth.ValidateToken(tokenStr, s.cfg.JWTSecret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		// Сохраняем claims в контекст для дальнейшего использования
		c.Set("claims", claims)
		c.Next()
	}
}
