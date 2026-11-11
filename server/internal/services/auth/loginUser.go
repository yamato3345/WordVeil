package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"wordveil/server/internal/token"

	"golang.org/x/crypto/bcrypt"
)

func (s *Service) LoginUser(ctx context.Context, email, password string) (string, error) {
	email = strings.TrimSpace(email)
	if email == "" {
		return "", errors.New("email is required")
	}
	if password == "" {
		return "", errors.New("password is required")
	}

	row, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		return "", fmt.Errorf("invalid email or password: %w", err)
	}
	err = bcrypt.CompareHashAndPassword(
		[]byte(row.PasswordHash),
		[]byte(password),
	)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	responseToken, err := token.GenerateToken(row.ID.String())
	if err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}

	return responseToken, nil
}
