package crm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/chuchull/CRM-service/internal/logger"
)

type CRMUserResult struct {
	Token         string `json:"token"`
	Name          string `json:"name"`
	LastLoginTime string `json:"lastLoginTime"`
	Logged        bool   `json:"logged"`
	Language      string `json:"language"`
}

type LoginCRMResponse struct {
	Status float64        `json:"status"`
	Result map[string]any `json:"result"`
}

func LoginCRM(username, password, apiKey, url string) (*CRMUserResult, error) {
	payload := map[string]string{
		"userName": username,
		"password": password,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		logger.Log.Errorf("CRM: error marshaling JSON: %v", err)
		return nil, fmt.Errorf("ошибка при сериализации: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		logger.Log.Errorf("CRM: error creating request: %v", err)
		return nil, fmt.Errorf("ошибка при создании запроса: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-KEY", apiKey)
	req.Header.Set("Authorization", "Basic dGVzdDoxMjM0NTY3ODk=")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		logger.Log.Errorf("CRM: error sending request: %v", err)
		return nil, fmt.Errorf("ошибка при отправке запроса: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("CRM: error reading response: %v", err)
		return nil, fmt.Errorf("ошибка при чтении ответа: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		logger.Log.Errorf("CRM: non-200 status: %d, body: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("статус код != 200: %d", resp.StatusCode)
	}

	var crmResp LoginCRMResponse
	if err := json.Unmarshal(body, &crmResp); err != nil {
		logger.Log.Errorf("CRM: error unmarshalling JSON: %v", err)
		return nil, fmt.Errorf("ошибка при разборе JSON: %w", err)
	}

	if crmResp.Status != 1 {
		logger.Log.Warnf("CRM login failed. status=%.0f, body=%s", crmResp.Status, string(body))
		return nil, fmt.Errorf("CRM вернул status != 1")
	}

	result := crmResp.Result
	loggedVal, _ := result["logged"].(bool)
	if !loggedVal {
		logger.Log.Warn("CRM login: logged=false")
		return nil, fmt.Errorf("авторизация не удалась: logged=false")
	}

	// Извлекаем поля
	user := &CRMUserResult{Logged: true}
	if token, ok := result["token"].(string); ok {
		user.Token = token
	}
	if name, ok := result["name"].(string); ok {
		user.Name = name
	}
	if lastLogin, ok := result["lastLoginTime"].(string); ok {
		user.LastLoginTime = lastLogin
	}
	if lang, ok := result["language"].(string); ok {
		user.Language = lang
	}

	logger.Log.Infof("CRM: successful login for user %s (CRM name=%s)", username, user.Name)
	return user, nil
}
