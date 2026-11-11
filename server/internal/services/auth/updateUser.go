package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"wordveil/server/internal/models"
	"wordveil/server/internal/storage/postgres/db"

	"github.com/jackc/pgx/v5/pgtype"
)

type UpdateUserRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email"`
}

func (s *Service) UpdateUser(
	ctx context.Context,
	userId string,
	name *string,
	email *string,
) (models.User, error) {
	var nameParams pgtype.Text
	var emailParams pgtype.Text

	if name != nil {
		value := strings.TrimSpace(*name)
		if value == "" {
			return models.User{}, errors.New("name cannot be empty")
		}
		nameParams = pgtype.Text{String: value, Valid: true}
	}
	if email != nil {
		value := strings.TrimSpace(*email)
		if value == "" {
			return models.User{}, errors.New("email cannot be empty")
		}
		emailParams = pgtype.Text{String: value, Valid: true}
	}

	var id pgtype.UUID
	if err := id.Scan(userId); err != nil {
		return models.User{}, fmt.Errorf("invalid user ID: %w", err)
	}

	row, err := s.queries.UpdateUser(ctx, db.UpdateUserParams{
		ID:    id,
		Name:  nameParams,
		Email: emailParams,
	})
	if err != nil {
		fmt.Errorf("update user: %w", err)
	}

	return models.User{
		ID:        row.ID.String(),
		Email:     row.Email,
		Name:      row.Name,
		UpdatedAt: row.UpdatedAt.Time,
	}, nil
}
