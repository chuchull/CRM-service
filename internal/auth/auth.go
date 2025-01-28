package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrInvalidToken       = errors.New("invalid token")
)

// LoginData - данные, которые приходят от пользователя при логине
type LoginData struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func CheckUserCredentials(username, password string) bool {
	// TODO: Подключение к БД/LDAP/CRM, чтобы проверить реальные данные пользователя
	// Для примера: захардкоженный вариант
	if username == "admin" && password == "admin123" {
		return true
	}
	return false
}

// GenerateJWT создает JWT-токен с userID (или username)
func GenerateJWT(username, secret string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 12).Unix(), // 12 часов
		"iat":      time.Now().Unix(),
	})

	return token.SignedString([]byte(secret))
}

// ValidateToken проверяет JWT-токен
func ValidateToken(tokenStr, secret string) (map[string]interface{}, error) {
	claims := jwt.MapClaims{}

	tkn, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil || !tkn.Valid {
		return nil, ErrInvalidToken
	}

	// Возвращаем claims для дальнейшего использования
	return claims, nil
}
