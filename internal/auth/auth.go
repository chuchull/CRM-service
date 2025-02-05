package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/chuchull/CRM-service/internal/logger"
)

// CRMUserResult - результат логина (прежняя структура)
type CRMUserResult struct {
	Token         string `json:"token"`
	Name          string `json:"name"`
	LastLoginTime string `json:"lastLoginTime"`
	Logged        bool   `json:"logged"`
	Language      string `json:"language"`
}

// LoginCRMResponse - структура ответа при логине
type LoginCRMResponse struct {
	Status float64        `json:"status"`
	Result map[string]any `json:"result"`
}

func LoginCRM(username, password, apiKey, crmURL, crmAuth string) (*CRMUserResult, error) {
	// Пример: crmURL = "http://127.0.0.1:8000/webservice/WebserviceStandard/Users/Login"
	// но можно сделать гибко (strings.TrimRight + "/Users/Login") - смотрите как у вас

	// Если у вас точный endpoint для логина:
	loginEndpoint := strings.TrimRight(crmURL, "/") + "/Users/Login"

	// Формируем тело
	payload := map[string]string{
		"userName": username,
		"password": password,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		logger.Log.Errorf("CRM: error marshaling JSON for login: %v", err)
		return nil, fmt.Errorf("ошибка сериализации JSON: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, loginEndpoint, bytes.NewBuffer(data))
	if err != nil {
		logger.Log.Errorf("CRM: error creating request for login: %v", err)
		return nil, fmt.Errorf("ошибка при создании запроса: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-KEY", apiKey)
	// Здесь токена X-TOKEN нет, т.к. мы ещё не залогинились
	req.Header.Set("Authorization", crmAuth)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		logger.Log.Errorf("CRM: error sending login request: %v", err)
		return nil, fmt.Errorf("ошибка при отправке запроса: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("CRM: error reading login response: %v", err)
		return nil, fmt.Errorf("ошибка чтения ответа: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		logger.Log.Errorf("CRM: login request returned code=%d, body=%s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("статус код != 200: %d", resp.StatusCode)
	}

	var response LoginCRMResponse
	if err := json.Unmarshal(body, &response); err != nil {
		logger.Log.Errorf("CRM: error unmarshaling login response: %v", err)
		return nil, fmt.Errorf("ошибка разбора JSON: %w", err)
	}

	if response.Status != 1 {
		logger.Log.Warnf("CRM login failed, status=%.0f, body=%s", response.Status, string(body))
		return nil, fmt.Errorf("CRM вернул status=%v", response.Status)
	}

	loggedVal, _ := response.Result["logged"].(bool)
	if !loggedVal {
		logger.Log.Warn("CRM: logged=false in login response")
		return nil, fmt.Errorf("авторизация не удалась, logged=false")
	}

	user := &CRMUserResult{Logged: true}
	if token, ok := response.Result["token"].(string); ok {
		user.Token = token
	}
	if name, ok := response.Result["name"].(string); ok {
		user.Name = name
	}
	if lastLogin, ok := response.Result["lastLoginTime"].(string); ok {
		user.LastLoginTime = lastLogin
	}
	if lang, ok := response.Result["language"].(string); ok {
		user.Language = lang
	}

	logger.Log.Infof("CRM: successful login for user=%s, CRM name=%s", username, user.Name)
	return user, nil
}
