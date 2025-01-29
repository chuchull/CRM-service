package server

import (
	"net/http"
	"strings"

	"github.com/chuchull/CRM-service/internal/auth"
	"github.com/chuchull/CRM-service/internal/logger"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware проверяет JWT
func (s *Server) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logger.Log.Warn("Missing Authorization header")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			logger.Log.Warnf("Invalid auth header format: %s", authHeader)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid auth header"})
			return
		}

		tokenStr := parts[1]
		claims, err := auth.ValidateToken(tokenStr, s.cfg.JWTSecret)
		if err != nil {
			logger.Log.Warnf("Invalid token: %v", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		// Сохраняем claims в контексте
		c.Set("claims", claims)
		c.Next()
	}
}
