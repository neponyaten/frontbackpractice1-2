Скрины хранятся в файле PDF!

## Практическое занятие №1
 Файл: /practice-1

## Практическое занятие №2

Файл: /practice-2


## Практическое занятие №3

Файл: PDF+PRACTICE-3-4

Тестирование:
backend/api.http
Используется расширение VS Code REST Client.

## Практическое занятие №4

Файл: PDF+PRACTICE-3-4

Запуск БЭК:
cd practice-3-4/backend
npm install
npm start

Запуск ФРОНТ:
cd practice-3-4/frontend
npm install
npm start

! Используются разные порты
3000 бэк - 3001 фронт

## Практическое занятие N5

cd practice-3-4/backend
node app.js

API: http://localhost:3000/api/products

Swagger: http://localhost:3000/api-docs

## Практическое занятие №7

Файл: /practice-3-4/backend

Реализована базовая система авторизации:

регистрация пользователя

вход пользователя

хеширование паролей через bcrypt

создание пользователей

базовая структура API

Реализованные маршруты:

POST /api/auth/register
POST /api/auth/login

## Практическое занятие №8

Добавлена работа с JWT токенами.

Реализовано:

генерация access token

middleware проверки токена

защищённые маршруты

получение текущего пользователя

Маршруты:

GET /api/auth/me

Для доступа требуется заголовок:

Authorization: Bearer ACCESS_TOKEN

## Практическое занятие №9

Добавлена работа с cookie и хранением refresh токена.

Реализовано:

refresh token в HttpOnly cookie

SameSite cookie

обновление access token

Маршрут:

POST /api/auth/refresh

## Практическое занятие №10

Добавлена система сессий пользователя.

Реализовано:

хранение активных refresh-сессий

просмотр активных сессий

отзыв конкретной сессии

Маршруты:

GET /api/auth/sessions
POST /api/auth/sessions/{id}/revoke

## Практическое занятие №11

Добавлена система RBAC (ролей пользователей).

Роли:

user
moderator
admin