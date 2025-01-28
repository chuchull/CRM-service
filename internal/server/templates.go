package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// TemplateResponse - структура для JSON шаблонов
type TemplateResponse struct {
	Tabs   []string               `json:"tabs"`
	Fields map[string]interface{} `json:"fields"`
}

// getUserTemplate - демонстрационная функция, которая возвращает JSON-шаблон
func (s *Server) getUserTemplate(c *gin.Context) {
	// В реальности тут можно вытянуть из context claims, посмотреть user role
	// claims, _ := c.Get("claims")

	// Формируем "динамически"
	tpl := TemplateResponse{
		Tabs: []string{"Home", "Contacts", "Deals"},
		Fields: map[string]interface{}{
			"Contacts": []string{"Name", "Phone", "Email"},
			"Deals":    []string{"DealName", "Stage", "Amount"},
		},
	}

	c.JSON(http.StatusOK, tpl)
}
