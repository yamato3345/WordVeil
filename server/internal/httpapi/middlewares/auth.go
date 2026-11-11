package middlewares

import (
	"context"
	"net/http"
	"strings"
	"wordveil/server/internal/token"
)

type contextKey string

const userIDKey contextKey = "userID"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		parts := strings.Fields(authHeader)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := token.ValidateToken(parts[1])
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		req := r.WithContext(ctx)

		next.ServeHTTP(w, req)
	})
}

func UserIdFromContext(ctx context.Context) (string, bool) {
	userId, ok := ctx.Value(userIDKey).(string)
	return userId, ok && userId != ""
}
