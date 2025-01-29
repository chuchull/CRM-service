package auth

import (
	"errors"
	"time"

	"github.com/chuchull/CRM-service/internal/logger"
	"github.com/golang-jwt/jwt/v4"
)

var (
	ErrInvalidToken = errors.New("invalid token")
)

func GenerateJWT(username, secret string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(12 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	})
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		logger.Log.Errorf("Error signing JWT: %v", err)
		return "", err
	}
	return signed, nil
}

func ValidateToken(tokenStr, secret string) (map[string]interface{}, error) {
	claims := jwt.MapClaims{}
	tkn, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil || !tkn.Valid {
		logger.Log.Errorf("Token validation failed: %v", err)
		return nil, ErrInvalidToken
	}

	return claims, nil
}
