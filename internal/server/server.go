package server

import (
	"fmt"
	"net/http"

	"github.com/chuchull/CRM-service/internal/config"
	"github.com/gin-gonic/gin"
)

// Server - основная структура сервера
type Server struct {
	cfg    *config.Config
	engine *gin.Engine
}

// NewHTTPServer - конструктор
func NewHTTPServer(cfg *config.Config) (*Server, error) {
	r := gin.Default()
	r.Use(CORSMiddleware()) // Добавляем CORS middleware
	s := &Server{cfg: cfg, engine: r}
	s.setupRoutes()
	return s, nil
}

// setupRoutes - регистрируем все маршруты
func (s *Server) setupRoutes() {
	s.engine.GET("/health", s.healthHandler)
	s.engine.POST("/api/login", s.loginHandler)

	// Группа защищённых роутов
	api := s.engine.Group("/api", s.AuthMiddleware())
	{
		// Подгруппа для CRM
		crmGroup := api.Group("/crm")
		{
			// GET /api/crm/modules
			crmGroup.GET("/modules", s.crmGetModulesHandler)

			// GET /api/crm/:module/fields
			crmGroup.GET("/:module/fields", s.crmGetFieldsHandler)

			// GET /api/crm/:module/recordsList
			crmGroup.GET("/:module/recordsList", s.crmGetRecordsListHandler)

			// POST /api/crm/:module/record
			crmGroup.POST("/:module/record", s.crmCreateRecordHandler)

			// PUT /api/crm/:module/record/:id
			crmGroup.PUT("/:module/record/:id", s.crmUpdateRecordHandler)

			// DELETE /api/crm/:module/record/:id
			crmGroup.DELETE("/:module/record/:id", s.crmDeleteRecordHandler)
		}
	}
}

// Запуск сервера
func (s *Server) Run() error {
	addr := fmt.Sprintf(":%s", s.cfg.HTTPPort)
	return s.engine.Run(addr)
}

// healthHandler - проверка работоспособности
func (s *Server) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
