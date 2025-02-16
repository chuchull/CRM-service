package crm

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/chuchull/CRM-service/internal/config"
	"github.com/chuchull/CRM-service/internal/logger"
)

// ====== 2) ОБЩИЕ СТРУКТУРЫ (Обёртка response) ======
// UserData - структура для данных пользователя
type UserData struct {
	FirstName           string `json:"first_name"`
	LastName            string `json:"last_name"`
	Email               string `json:"email1"`
	SecondaryPhone      string `json:"phone_crm_extension"`
	SecondaryPhoneExtra string `json:"phone_crm_extension_extra"`
	Description         string `json:"description"`
}

type CRMResponse[T any] struct {
	Status float64 `json:"status"`
	Result T       `json:"result"`
}

type FieldsResponse struct {
	Fields map[string]any `json:"fields"`
}

type RecordsListResult struct {
	Headers         map[string]string         `json:"headers"`
	Records         map[string]map[string]any `json:"records"`
	Permissions     map[string]any            `json:"permissions"`
	NumberOfRecords int                       `json:"numberOfRecords"`
	IsMorePages     bool                      `json:"isMorePages"`
}

type CreateRecordResult struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// FetchUserDataByID делает запрос для получения данных пользователя по ID
func FetchUserDataByID(cfg *config.Config, userID string) (*UserData, error) {
	apiURL := strings.TrimRight(cfg.CRMUrl, "/") + "/Users/Record/" + userID
	client := &http.Client{}
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		logger.Log.Errorf("FetchUserDataByID: error creating request: %v", err)
		return nil, err
	}

	req.Header.Set("X-API-KEY", cfg.CRMApiKey)
	req.Header.Set("X-TOKEN", CrmToken())
	req.Header.Set("Authorization", cfg.CRMAuth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-ENCRYPTED", "0")

	resp, err := client.Do(req)
	if err != nil {
		logger.Log.Errorf("FetchUserDataByID: error sending request: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("FetchUserDataByID: error reading response body: %v", err)
		return nil, err
	}

	var apiResponse struct {
		Status float64 `json:"status"`
		Result struct {
			Fields map[string]string `json:"fields"`
			Data   UserData          `json:"data"`
		} `json:"result"`
	}
	err = json.Unmarshal(body, &apiResponse)
	if err != nil {
		logger.Log.Errorf("FetchUserDataByID: error unmarshalling response: %v", err)
		return nil, err
	}

	if apiResponse.Status != 1 {
		logger.Log.Warnf("FetchUserDataByID: CRM returned status=%.0f", apiResponse.Status)
		return nil, fmt.Errorf("CRM returned status=%.0f", apiResponse.Status)
	}

	logger.Log.Infof("%s", apiResponse.Result.Data.Email+" "+apiResponse.Result.Data.Description+" "+apiResponse.Result.Data.SecondaryPhone+" "+apiResponse.Result.Data.SecondaryPhoneExtra)
	logger.Log.Infof("FetchUserDataByID: successfully fetched user data for userID=%s", userID)
	return &apiResponse.Result.Data, nil
}

// ====== 3) Получение СПИСКА МОДУЛЕЙ  ======

type ModulesResult map[string]string

func GetModules(crmURL, apiKey, crmAuth, crmToken string) (ModulesResult, error) {
	endpoint := strings.TrimRight(crmURL, "/") + "/Modules"

	var result ModulesResult
	if err := doCRMRequest(http.MethodGet, endpoint, apiKey, crmAuth, crmToken, nil, &result, nil); err != nil {
		return nil, fmt.Errorf("GetModules failed: %w", err)
	}
	return result, nil
}

// ====== 4) Получение ПОЛЕЙ МОДУЛЯ ======
func GetFields(crmURL, apiKey, crmAuth, crmToken, moduleName, fieldsType string) (*FieldsResponse, error) {
	endpoint := fmt.Sprintf("%s/%s/Fields", strings.TrimRight(crmURL, "/"), moduleName)

	qs := ""
	if fieldsType != "" {
		qs = "?x-fields-type=" + fieldsType
	}
	endpoint += qs

	var f FieldsResponse
	if err := doCRMRequest(http.MethodGet, endpoint, apiKey, crmAuth, crmToken, nil, &f, map[string]string{
		"x-fields-type": fieldsType,
	}); err != nil {
		return nil, fmt.Errorf("GetFields failed: %w", err)
	}
	return &f, nil
}

// ====== 5) Получение СПИСКА ЗАПИСЕЙ  ======

func GetRecordsList(crmURL, apiKey, crmAuth, crmToken, moduleName string) (*RecordsListResult, error) {
	endpoint := fmt.Sprintf("%s/%s/RecordsList", strings.TrimRight(crmURL, "/"), moduleName)

	var rl RecordsListResult
	if err := doCRMRequest(http.MethodGet, endpoint, apiKey, crmAuth, crmToken, nil, &rl, nil); err != nil {
		return nil, fmt.Errorf("GetRecordsList failed: %w", err)
	}
	return &rl, nil
}

// ====== 6) Создание записи  ======

func CreateRecord(crmURL, apiKey, crmAuth, crmToken, moduleName string, body map[string]any) (*CreateRecordResult, error) {
	endpoint := fmt.Sprintf("%s/%s/Record", strings.TrimRight(crmURL, "/"), moduleName)

	var cr CreateRecordResult
	if err := doCRMRequest(http.MethodPost, endpoint, apiKey, crmAuth, crmToken, body, &cr, nil); err != nil {
		return nil, fmt.Errorf("CreateRecord failed: %w", err)
	}
	return &cr, nil
}

// ====== 7) Редактирование записи  ======

func UpdateRecord(crmURL, apiKey, crmAuth, crmToken, moduleName string, recordId int, body map[string]any) (*CreateRecordResult, error) {
	endpoint := fmt.Sprintf("%s/%s/Record/%d", strings.TrimRight(crmURL, "/"), moduleName, recordId)

	var cr CreateRecordResult
	if err := doCRMRequest(http.MethodPut, endpoint, apiKey, crmAuth, crmToken, body, &cr, nil); err != nil {
		return nil, fmt.Errorf("UpdateRecord failed: %w", err)
	}
	return &cr, nil
}

// ====== 8) Удаление записи  ======

func DeleteRecord(crmURL, apiKey, crmAuth, crmToken, moduleName string, recordId int) (bool, error) {
	endpoint := fmt.Sprintf("%s/%s/Record/%d", strings.TrimRight(crmURL, "/"), moduleName, recordId)

	var res bool
	if err := doCRMRequest(http.MethodDelete, endpoint, apiKey, crmAuth, crmToken, nil, &res, nil); err != nil {
		return false, fmt.Errorf("DeleteRecord failed: %w", err)
	}
	return res, nil
}
