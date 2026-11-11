package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"wordveil/server/internal/httpapi/middlewares"

	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Userhandler) GetUserHandler(rw http.ResponseWriter, r *http.Request) {
	userIDSring, ok := middlewares.UserIdFromContext(r.Context())
	if !ok {
		http.Error(rw, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var userId pgtype.UUID
	err := userId.Scan(userIDSring)
	if err != nil {
		http.Error(rw, fmt.Sprintf("Failed to parse user ID: %v", err), http.StatusInternalServerError)
		return
	}

	user, err := h.authServise.GetUser(r.Context(), userId)
	if err != nil {
		http.Error(rw, fmt.Sprintf("Failed to get user: %v", err), http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(rw).Encode(user)
}
