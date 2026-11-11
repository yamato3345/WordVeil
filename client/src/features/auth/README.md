# Авторизація

`AuthProvider` показує `AuthPage` до входу. Реєстрація надсилає
`{ name, email, password }` на `POST /register/`, після успіху відкриває
форму входу. Вхід надсилає `{ email, password }` на `POST /login/`,
отримує `accessToken` і запитує `GET /user/` із заголовком
`Authorization: Bearer <token>`.

Токен зберігається лише в пам’яті до виходу або перезапуску клієнта.
Серверний профіль показано на сторінці профілю; налаштування навчання
залишаються локальними налаштуваннями пристрою.

## Підключення

Для `npm run dev` і Tauri dev запустіть Go API на `localhost:8080`.
Vite пересилає `/api/*` на сервер, прибираючи префікс `/api`.
Для іншої адреси сервера задайте `API_PROXY_TARGET` під час запуску Vite.

Для production-збірки можна задати `VITE_API_URL` у `.env.local`
(наприклад, `VITE_API_URL=https://api.example.com`) перед `npm run build`.
За замовчуванням production звертається до `http://localhost:8080`.
Vite proxy працює лише в dev: для production API має дозволяти CORS
для походження клієнта, включно з заголовками `Content-Type` та
`Authorization` і preflight OPTIONS, або бути доступним через proxy
того самого походження. Go сервер має CORS middleware: за замовчуванням
дозволені `http://localhost:1430`, `http://127.0.0.1:1430`,
`tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`.
Для production задайте на сервері `CORS_ALLOWED_ORIGINS` — точні адреси
клієнтів через кому. Цей список замінює локальні значення.
