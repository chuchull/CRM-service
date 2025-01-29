# Архитектура Промежуточного Сервиса

## Общая структура
- `cmd/service/main.go` — точка входа
- `internal/config` — конфигурация
- `internal/server` — веб-сервер (Gin) и роуты
- `internal/asterisk` — модуль для связи с Asterisk (AMI/ARI)
- `internal/crm` — модуль для связи с YetiforceCRM
- `internal/billing` — модуль для связи с биллинг-системой
- `internal/calls` — управление логикой звонков (хранение, статус, история)

CRM-SERVICE:
- Получает **логин/пароль** пользователя → вызывает метод `LoginCRM` в YetiforceCRM → при успехе возвращает локальный **JWT**.
- Обрабатывает все **последующие запросы** через `AuthMiddleware` (проверка JWT) → защищённые эндпоинты.
- Логирует все **ошибки** и события в файл `logs/app.log` (через `logrus`).

## 2. Схема взаимодействия (упрощённая)

```mermaid
flowchart LR
    subgraph User
    direction LR
    UI-->Client
    end

    Client --(POST /login)--> CRM-SERVICE

    CRM-SERVICE --(LoginCRM)--> CRM

    CRM --> CRM-SERVICE
    CRM-SERVICE --> Client

    Client --(GET /api/templates, Bearer Token)--> CRM-SERVICE
    CRM-SERVICE --> Client
