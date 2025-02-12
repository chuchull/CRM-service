package crm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/chuchull/CRM-service/internal/auth"
	"github.com/chuchull/CRM-service/internal/config"
	"github.com/chuchull/CRM-service/internal/logger"
)

var crmToken string

func loginAndSaveToken(cfg *config.Config) error {
	userResult, err := auth.LoginCRM(cfg.CRMlogin, cfg.CRMpasswd, cfg.CRMApiKey, cfg.CRMUrl, cfg.CRMAuth)
	if err != nil {
		return fmt.Errorf("CRM login failed: %w", err)
	}
	crmToken = userResult.Token
	logger.Log.Infof("CRM token obtained successfully: %s", crmToken)
	return nil
}

func CrmToken() string {
	return crmToken
}

func InitCRM(cfg *config.Config) {
	err := loginAndSaveToken(cfg)
	if err != nil {
		logger.Log.Errorf("Failed to login to CRM: %v. Продолжаем запуск без CRM.", err)
		// crmToken остаётся пустым или можно назначить дефолтное значение
	}
	go func() {
		for {
			time.Sleep(24 * time.Hour)
			err := loginAndSaveToken(cfg)
			if err != nil {
				logger.Log.Errorf("Failed to refresh CRM token: %v", err)
			}
		}
	}()
}

// ====== 9) ВСПОМОГАТЕЛЬНАЯ doCRMRequest  ======

func doCRMRequest[T any](
	method, endpoint, apiKey, crmAuth, crmToken string,
	requestBody any, dest *T,
	extraHeaders map[string]string,
) error {
	// 1. Логируем метод и endpoint
	logger.Log.Infof("CRM request: %s %s", method, endpoint)

	// 2. Формируем тело запроса (если есть)
	var reqBody io.Reader
	var rawBody []byte
	if requestBody != nil {
		data, err := json.Marshal(requestBody)
		if err != nil {
			logger.Log.Errorf("CRM: error marshaling body: %v", err)
			return fmt.Errorf("failed to marshal requestBody: %w", err)
		}
		rawBody = data
		reqBody = bytes.NewBuffer(data)
	}

	// 3. Создаём запрос
	req, err := http.NewRequest(method, endpoint, reqBody)
	if err != nil {
		logger.Log.Errorf("CRM: error creating request: %v", err)
		return fmt.Errorf("failed to create request: %w", err)
	}

	// 4. Устанавливаем обязательные заголовки
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-KEY", apiKey)
	req.Header.Set("Authorization", crmAuth)
	if crmToken != "" {
		req.Header.Set("X-TOKEN", crmToken)
	}

	// 5. Доп. заголовки (например, x-fields-type)
	for k, v := range extraHeaders {
		req.Header.Set(k, v)
	}

	// --- ЛОГИРУЕМ заголовки запроса ---
	logger.Log.Infof("Request Headers:")
	for name, values := range req.Header {
		for _, val := range values {
			logger.Log.Infof("  %s: %s", name, val)
		}
	}

	// --- ЛОГИРУЕМ тело запроса (если нужно) ---
	if rawBody != nil && len(rawBody) > 0 {
		logger.Log.Infof("Request Body: %s", string(rawBody))
	}

	// 6. Отправляем запрос
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		logger.Log.Errorf("CRM: request failed: %v", err)
		return fmt.Errorf("CRM request failed: %w", err)
	}
	defer resp.Body.Close()

	// 7. Логируем HTTP-статус ответа
	logger.Log.Infof("CRM response status: %d %s", resp.StatusCode, http.StatusText(resp.StatusCode))

	// --- ЛОГИРУЕМ заголовки ответа (при необходимости) ---
	logger.Log.Infof("Response Headers:")
	for name, values := range resp.Header {
		for _, val := range values {
			logger.Log.Infof("  %s: %s", name, val)
		}
	}

	// 8. Читаем тело ответа
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("CRM: error reading response: %v", err)
		return fmt.Errorf("CRM: error reading response: %w", err)
	}

	// ЛОГИРУЕМ тело ответа
	logger.Log.Infof("Response Body: %s", string(body))

	if resp.StatusCode != http.StatusOK {
		logger.Log.Errorf("CRM: non-200 code: %d, body=%s", resp.StatusCode, string(body))
		return fmt.Errorf("CRM request failed with status=%d", resp.StatusCode)
	}

	// 9. Парсим JSON
	var wrapper CRMResponse[T]
	if err := json.Unmarshal(body, &wrapper); err != nil {
		logger.Log.Errorf("CRM: error unmarshalling: %v", err)
		return fmt.Errorf("failed to unmarshal into CRMResponse: %w", err)
	}

	// 10. Проверяем статус
	if wrapper.Status != 1 {
		logger.Log.Warnf("CRM: status != 1, body=%s", string(body))
		return fmt.Errorf("CRM returned status=%.0f", wrapper.Status)
	}

	*dest = wrapper.Result
	return nil
}
