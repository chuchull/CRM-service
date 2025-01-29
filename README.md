# CRM-SERVICE

**CRM-SERVICE** — промежуточный сервис на Go, интегрирующийся с YetiforceCRM (для авторизации), Asterisk (телефония), биллинг-системами и предоставляющий API для фронтенда. Основные функции:

- **Авторизация**: Проверка логина/пароля через CRM и выдача JWT-токена для работы с сервисом.
- **Безопасность**: Защищённые эндпоинты с помощью JWT (Bearer Token).
- **Логирование**: Запись всех ошибок и важных событий в локальный файл (используется `logrus`).
- **Динамические шаблоны** (TPL): Возможность отдавать фронтенду JSON-шаблоны для интерфейса.

## Структура проекта

```bash
CRM-service/
├── cmd/
│   └── service/
│       └── main.go         # Точка входа (запуск сервиса)
├── docs/
│   └── architecture.md     # Подробная документация
├── internal/
│   ├── auth/
│   │   └── auth.go         # JWT-логика (генерация/валидация)
│   ├── crm/
│   │   └── crm.go          # Подключение/логин к YetiforceCRM
│   ├── server/
│   │   ├── server.go       # Настройка Gin-сервера, роутов
│   │   ├── middleware.go   # JWT-миддлварь
│   │   └── templates.go    # Пример выдачи JSON-шаблонов
│   ├── config/
│   │   └── config.go       # Чтение и хранение конфигурации (порт, секреты)
│   ├── logger/
│   │   └── logger.go       # Инициализация logrus, запись в файл
│   ├── asterisk/           # Пустой пока - под будущую логику Asterisk
│   ├── billing/            # Пустой пока - под будущую логику биллинга
│   └── calls/              # Пустой пока - под будущую логику звонков
├── logs/
│   └── app.log             # Файл лога (создаётся при запуске)
├── .gitignore
├── go.mod
├── go.sum
└── README.md


Быстрый старт

    Установите Go (версия 1.18+).

    Склонируйте репозиторий:

git clone ...
cd CRM-service

Создайте папку для логов:

mkdir logs

Запустите:

    go mod tidy
    go run cmd/service/main.go

        Сервер стартует на порту HTTP_PORT (по умолчанию 8080).
        Логи записываются в logs/app.log.

    Проверка:
        GET /health → {"status":"ok"}
        POST /login (JSON {"username":"admin@mail.ru","password":"123456789"})
        → при успехе вернёт JWT и crmToken.

Пример запросов

    Авторизация (логин):

curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@mail.ru","password":"123456789"}'

Ответ (пример):

{ 
  "jwt": "...", 
  "crmToken": "ad8e1fc0...", 
  "name": "Administrator Yeti" 
}

Получение JSON-шаблонов (защищённый эндпоинт):

curl -X GET http://localhost:8080/api/templates \
  -H "Authorization: Bearer <JWT_ИЗ_ЛОГИНА>"

Ответ (пример):

   {
      "user": "admin@mail.ru",
      "tabs": ["Home","Contacts","Deals"],
      "fields": {
        "Contacts": ["Name","Phone"],
        "Deals": ["DealName","Stage"]
   }

Переменные окружения
Переменная	Описание	По умолчанию
HTTP_PORT	Порт для HTTP сервера	8080
JWT_SECRET	Секрет для подписи JWT	default_secret
CRM_API_KEY	Ключ для API CRM	ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5
CRM_URL	URL для логина в CRM	http://127.0.0.1:8000/...
Контакты / Авторы

    [Daler], [Davlatzodadkh17@gmail.com]
    