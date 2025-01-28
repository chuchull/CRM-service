# Архитектура Промежуточного Сервиса

## Общая структура
- `cmd/service/main.go` — точка входа
- `internal/config` — конфигурация
- `internal/server` — веб-сервер (Gin) и роуты
- `internal/asterisk` — модуль для связи с Asterisk (AMI/ARI)
- `internal/crm` — модуль для связи с YetiforceCRM
- `internal/billing` — модуль для связи с биллинг-системой
- `internal/calls` — управление логикой звонков (хранение, статус, история)
