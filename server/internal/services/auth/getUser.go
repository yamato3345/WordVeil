package auth

import (
	"context"
	"fmt"
	"wordveil/server/internal/models"

	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) GetUser(ctx context.Context, userId pgtype.UUID) (models.User, error) {
	row, err := s.queries.GetUserById(ctx, userId)
	if err != nil {
		return models.User{}, fmt.Errorf("get user by id: %w", err)
	}

	responseUser := models.User{
		ID:        row.ID.String(),
		Name:      row.Name,
		Email:     row.Email,
		CreatedAt: row.CreatedAt.Time,
	}

	return responseUser, nil
}
