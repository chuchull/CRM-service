package server

import (
	"net/http"

	"github.com/chuchull/CRM-service/internal/logger"
	"github.com/gin-gonic/gin"
)

// getUserTemplate - демонстрационная функция: отдаёт JSON-шаблон на фронт
func (s *Server) getUserTemplate(c *gin.Context) {
	claimsVal, ok := c.Get("claims")
	if !ok {
		logger.Log.Warn("No claims in context (this should not happen if AuthMiddleware is correct)")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing claims"})
		return
	}

	// Можем посмотреть, кто залогинен
	claims, _ := claimsVal.(map[string]interface{})
	username := ""
	if un, ok := claims["username"].(string); ok {
		username = un
	}

	// Пример формирования шаблона (можно динамически)
	tpl := gin.H{
		"user":   username,
		"tabs":   []string{"Home", "Contacts", "Deals"},
		"fields": map[string]any{"Contacts": []string{"Name", "Phone"}, "Deals": []string{"DealName", "Stage"}},
	}

	c.JSON(http.StatusOK, tpl)
}
