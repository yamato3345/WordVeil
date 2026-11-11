package auth

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) DeleteUser(ctx context.Context, userId pgtype.UUID) error {
	rowsAffected, err := s.queries.DeleteUser(ctx, userId)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no user found with id: %s", userId)
	}

	return nil
}
