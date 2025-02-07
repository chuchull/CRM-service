package ldap_server

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"

	"github.com/chuchull/CRM-service/internal/auth"
	"github.com/chuchull/CRM-service/internal/config"
	"github.com/chuchull/CRM-service/internal/crm"
	"github.com/nmcclain/ldap"
)

// Структура ответа от API YetiForce CRM
type YetiForceResponse struct {
	Status int `json:"status"`
	Result struct {
		Records map[string]User `json:"records"`
	} `json:"result"`
}

type User struct {
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	RoleID       string `json:"roleid"`
	Email        string `json:"email1"`
	PrimaryPhone string `json:"primary_phone"`
	RecordLabel  string `json:"recordLabel"`
}

// LDAPHandler реализует интерфейсы Binder и Searcher
type LDAPHandler struct {
	cfg *config.Config
}

// Bind – обработка аутентификации пользователей
func (h *LDAPHandler) Bind(bindDN, bindSimplePw string, conn net.Conn) (ldap.LDAPResultCode, error) {
	username := bindDN
	password := bindSimplePw

	userResult, err := auth.LoginCRM(username, password, h.cfg.CRMApiKey, h.cfg.CRMUrl, h.cfg.CRMAuth)
	if err != nil || !userResult.Logged {
		log.Println("Ошибка аутентификации пользователя")
		return ldap.LDAPResultInvalidCredentials, nil
	}
	return ldap.LDAPResultSuccess, nil
}

// Search – обработка поисковых запросов из LDAP
func (h *LDAPHandler) Search(boundDN string, req ldap.SearchRequest, conn net.Conn) (ldap.ServerSearchResult, error) {
	log.Printf("LDAP Search: BaseDN=%s, Filter=%s", req.BaseDN, req.Filter)

	users, err := fetchUsersFromCRM()
	if err != nil {
		log.Printf("Ошибка получения пользователей из CRM: %v", err)
		return ldap.ServerSearchResult{ResultCode: ldap.LDAPResultOperationsError}, nil
	}

	var entries []*ldap.Entry
	for _, user := range users {
		entry := &ldap.Entry{
			DN: fmt.Sprintf("cn=%s,ou=users,dc=example,dc=com", user.Email),
			Attributes: []*ldap.EntryAttribute{
				{Name: "cn", Values: []string{user.Email}},
				{Name: "mail", Values: []string{user.Email}},
				{Name: "givenName", Values: []string{user.FirstName}},
				{Name: "sn", Values: []string{user.LastName}},
				{Name: "telephoneNumber", Values: []string{user.PrimaryPhone}},
				{Name: "title", Values: []string{user.RoleID}},
				{Name: "objectClass", Values: []string{"person"}},
			},
		}
		entries = append(entries, entry)
	}

	return ldap.ServerSearchResult{Entries: entries, ResultCode: ldap.LDAPResultSuccess}, nil
}

// fetchUsersFromCRM – получает пользователей из YetiForce CRM
func fetchUsersFromCRM() ([]User, error) {
	apiURL := "http://127.0.0.1:8000/webservice/WebserviceStandard/Users/RecordsList"
	client := &http.Client{}
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("X-API-KEY", "ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5")
	req.Header.Set("X-TOKEN", crm.CrmToken())
	req.Header.Set("Authorization", "Basic dGVzdDoxMjM0NTY3ODk=")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var apiResponse YetiForceResponse
	err = json.Unmarshal(body, &apiResponse)
	if err != nil {
		return nil, err
	}

	var users []User
	for _, record := range apiResponse.Result.Records {
		users = append(users, record)
	}
	return users, nil
}

// StartLDAP запускает LDAP-сервер
func StartLDAP() {

	cfg, err := config.LoadConfig()

	server := ldap.NewServer()

	handler := &LDAPHandler{cfg: cfg}

	server.BindFunc("", handler)
	server.SearchFunc("", handler)

	listener, err := net.Listen("tcp", "0.0.0.0:3890")
	if err != nil {
		log.Fatalf("Ошибка запуска сервера LDAP: %s", err)
	}
	defer listener.Close()

	log.Println("LDAP-сервер запущен на порту 3890...")

	if err := server.Serve(listener); err != nil {
		log.Fatalf("Ошибка работы LDAP-сервера: %s", err)
	}
}
