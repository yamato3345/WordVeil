package handlers

import (
	"fmt"
	"net/http"
	"wordveil/server/internal/httpapi/middlewares"

	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Userhandler) DeleteUser(rw http.ResponseWriter, req *http.Request) {
	userIdString, ok := middlewares.UserIdFromContext(req.Context())
	if !ok {
		http.Error(rw, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var userId pgtype.UUID
	err := userId.Scan(userIdString)
	if err != nil {
		http.Error(rw, fmt.Sprintf("Failed to parse user ID: %v", err), http.StatusInternalServerError)
		return
	}

	err = h.authServise.DeleteUser(req.Context(), userId)
	if err != nil {
		http.Error(rw, fmt.Sprintf("Failed to delete user: %v", err), http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(http.StatusNoContent)
}
