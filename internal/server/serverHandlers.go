package server

import (
	"net/http"
	"strconv"

	"github.com/chuchull/CRM-service/internal/auth"
	"github.com/chuchull/CRM-service/internal/crm"
	"github.com/chuchull/CRM-service/internal/logger"
	"github.com/gin-gonic/gin"
)

// ----------------------------------------------------------------------
// 1) Авторизация /login
// ----------------------------------------------------------------------

// loginHandler - обработчик маршрута /api/login
func (s *Server) loginHandler(c *gin.Context) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Log.Errorf("loginHandler: invalid body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// 1. Находим ID пользователя по email из кэша
	userID, err := crm.GetUserIDByEmail(body.Username)
	if err != nil {
		logger.Log.Warnf("User not found in cache: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	// 2. Делаем запрос для получения данных пользователя по ID
	userData, err := crm.FetchUserDataByID(s.cfg, userID)
	if err != nil {
		logger.Log.Errorf("Failed to fetch user data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user data"})
		return
	}

	// 3. Логинимся для получения токена
	userResult, err := auth.LoginCRM(body.Username, body.Password, s.cfg.CRMApiKey, s.cfg.CRMUrl, s.cfg.CRMAuth)
	if err != nil {
		logger.Log.Warnf("CRM login failed for user=%s: %v", body.Username, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 4. Возвращаем необходимые данные в ответе
	c.JSON(http.StatusOK, gin.H{
		"first_name":            userData.FirstName,
		"last_name":             userData.LastName,
		"email":                 userData.Email,
		"secondary_phone":       userData.SecondaryPhone,
		"secondary_phone_extra": userData.SecondaryPhoneExtra,
		"description":           userData.Description,
		"token":                 userResult.Token,
		"api_key":               s.cfg.CRMApiKey,
		"authorization":         s.cfg.CRMAuth,
	})
}

// ----------------------------------------------------------------------
// 4) CRM Handlers
// ----------------------------------------------------------------------

// Помощник для получения crmToken из заголовка X-TOKEN (или из body)
func (s *Server) getCRMToken(c *gin.Context) string {
	// Например, ожидаем, что клиент пришлёт "X-TOKEN: <crmToken>"
	return c.GetHeader("X-TOKEN")
}

func (s *Server) crmGetModulesHandler(c *gin.Context) {
	crmToken := s.getCRMToken(c)
	if crmToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing X-TOKEN"})
		return
	}
	modules, err := crm.GetModules(s.cfg.CRMUrl, s.cfg.CRMApiKey, s.cfg.CRMAuth, crmToken)
	if err != nil {
		logger.Log.Errorf("crmGetModulesHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"modules": modules})
}

func (s *Server) crmGetFieldsHandler(c *gin.Context) {
	moduleName := c.Param("module")
	crmToken := s.getCRMToken(c)
	if crmToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing X-TOKEN"})
		return
	}
	// Допустим, query: ?x-fields-type=fields,blocks
	fieldsType := c.Query("x-fields-type")

	resp, err := crm.GetFields(s.cfg.CRMUrl, s.cfg.CRMApiKey, s.cfg.CRMAuth, crmToken, moduleName, fieldsType)
	if err != nil {
		logger.Log.Errorf("crmGetFieldsHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (s *Server) crmGetRecordsListHandler(c *gin.Context) {
	moduleName := c.Param("module")
	crmToken := s.getCRMToken(c)
	if crmToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing X-TOKEN"})
		return
	}
	rList, err := crm.GetRecordsList(s.cfg.CRMUrl, s.cfg.CRMApiKey, s.cfg.CRMAuth, crmToken, moduleName)
	if err != nil {
		logger.Log.Errorf("crmGetRecordsListHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rList)
}

func (s *Server) crmCreateRecordHandler(c *gin.Context) {
	moduleName := c.Param("module")
	crmToken := s.getCRMToken(c)
	if crmToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing X-TOKEN"})
		return
	}

	var body map[string]any
	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Log.Errorf("crmCreateRecordHandler: invalid body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	result, err := crm.CreateRecord(s.cfg.CRMUrl, s.cfg.CRMApiKey, s.cfg.CRMAuth, crmToken, moduleName, body)
	if err != nil {
		logger.Log.Errorf("crmCreateRecordHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (s *Server) crmUpdateRecordHandler(c *gin.Context) {
	moduleName := c.Param("module")
	crmToken := s.getCRMToken(c)
	if crmToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing X-TOKEN"})
		return
	}

	recordIdStr := c.Param("id")
	recordId, err := strconv.Atoi(recordIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid record id"})
		return
	}

	var body map[string]any
	if err2 := c.ShouldBindJSON(&body); err2 != nil {
		logger.Log.Errorf("crmUpdateRecordHandler: invalid body: %v", err2)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	result, err2 := crm.UpdateRecord(s.cfg.CRMUrl, s.cfg.CRMApiKey, s.cfg.CRMAuth, crmToken, moduleName, recordId, body)
	if err2 != nil {
		logger.Log.Errorf("crmUpdateRecordHandler: %v", err2)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err2.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (s *Server) crmDeleteRecordHandler(c *gin.Context) {
	moduleName := c.Param("module")
	crmToken := s.getCRMToken(c)
	if crmToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing X-TOKEN"})
		return
	}

	recordIdStr := c.Param("id")
	recordId, err := strconv.Atoi(recordIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid record id"})
		return
	}

	ok, err2 := crm.DeleteRecord(s.cfg.CRMUrl, s.cfg.CRMApiKey, s.cfg.CRMAuth, crmToken, moduleName, recordId)
	if err2 != nil {
		logger.Log.Errorf("crmDeleteRecordHandler: %v", err2)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err2.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"result": ok})
}

// updateDataHandler receives JSON POST data and logs the request body.
func (s *Server) updateDataHandler(c *gin.Context) {
	var reqBody map[string]interface{}
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		logger.Log.Errorf("updateDataHandler: invalid JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}
	logger.Log.Infof("updateDataHandler: received data: %v", reqBody)
	c.JSON(http.StatusOK, gin.H{"status": "data received"})
}
