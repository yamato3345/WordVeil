# Запити через sqlc

- `migrations/` — SQL для зміни структури БД. Застосування: `make migrate-up`.
- `queries/` — SQL-запити з анотаціями sqlc. Редагуй їх вручну.
- `db/` — згенеровані Go-структури й методи. Не редагуй вручну; коміть разом із SQL.

Після зміни запитів або схеми виконуй із кореня `server`:

```sh
make sqlc-generate
```

Генерація читає SQL-файли й не потребує запущеної БД. Вона не застосовує
міграції: це окрема команда `make migrate-up`.

У `queries/users.sql` анотація `-- name: CreateUser :one` задає назву Go-методу
і очікування одного рядка у відповіді. `:many` використовується для списків,
`:exec` — коли результат запиту не потрібно читати.

Після створення та перевірки підключення `pool` типу `*pgxpool.Pool` можна
створити `queries := db.New(pool)` і викликати:

```go
user, err := queries.CreateUser(ctx, db.CreateUserParams{
    Name:         name,
    Email:        email,
    PasswordHash: passwordHash,
})
```

Імпорт пакета: `wordveil/server/internal/storage/postgres/db`.
`ctx`, `name`, `email` і `passwordHash` — дані виклику; пароль хешує сервіс.
Пул підключень ще потрібно реалізувати й передати у сховище/сервіс.
Метод повертає Go-структуру та помилку; перетворення на HTTP/JSON залишається
відповідальністю хендлера.

Для встановлення тієї ж версії інструмента на іншому комп'ютері:

```sh
go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1
```
