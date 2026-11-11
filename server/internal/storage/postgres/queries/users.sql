-- name: CreateUser :one

INSERT INTO users (
  name, 
  email,
  password_hash
)

VALUES(
  $1, $2, $3 
  
)

RETURNING id, name, email, created_at;

-- name: GetUserByEmail :one
  
  SELECT id, name, email, password_hash
  FROM users
  

  WHERE  lower(email) = lower($1) 
    AND deleted_at IS NULL;


-- name: GetUserById :one

  SELECT id, name, email, created_at
  FROM users
  WHERE id = $1
    AND deleted_at IS NULL;


-- name: UpdateUser :one 
  UPDATE users 
  SET 
      name = COALESCE(sqlc.narg('name')::varchar, name),
      email = COALESCE(sqlc.narg('email')::varchar, email)
  WHERE id = sqlc.narg('id')
      AND deleted_at IS NULL
  RETURNING id, name, email, created_at, updated_at;

-- name: DeleteUser :execrows
  DELETE FROM users
  WHERE id = sqlc.arg('id');
