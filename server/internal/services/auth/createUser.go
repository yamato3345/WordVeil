package auth

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"wordveil/server/internal/models"
	"wordveil/server/internal/storage/postgres/db"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	queries *db.Queries
}

func NewService(quesries *db.Queries) *Service {
	return &Service{
		queries: quesries,
	}
}

func (s *Service) CreateUser(ctx context.Context, name, email, password string) (models.User, error) {
	if password == "" {
		return models.User{}, errors.New("password is required")
	}
	if name == "" {
		return models.User{}, errors.New("name is required")
	}

	if email == "" {
		return models.User{}, errors.New("email is required")
	}
	email = strings.TrimSpace(email)
	name = strings.TrimSpace(name)
	address, err := mail.ParseAddress(email)
	if err != nil || address.Address != email {
		return models.User{}, errors.New("invalid email address")
	}

	passwordHash, err := hashPassword(password)
	if err != nil {
		return models.User{}, fmt.Errorf("hash password: %w", err)
	}

	row, err := s.queries.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		Name:         name,
		PasswordHash: string(passwordHash),
	})
	if err != nil {
		return models.User{}, fmt.Errorf("create user: %w", err)
	}
	return models.User{
		ID:        row.ID.String(),
		Name:      row.Name,
		Email:     row.Email,
		CreatedAt: row.CreatedAt.Time,
	}, nil
}

func hashPassword(password string) ([]byte, error) {
	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	return hash, nil
}
