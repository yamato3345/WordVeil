package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"wordveil/server/internal/httpapi/middlewares"
	"wordveil/server/internal/services/auth"

	"github.com/jackc/pgx/v5/pgtype"
)

type UpdateUserResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	UpdatedAt string `json:"updated_at"`
}

func (h *Userhandler) UpdateUserHandler(rw http.ResponseWriter, req *http.Request) {
	input := auth.UpdateUserRequest{}
	err := json.NewDecoder(req.Body).Decode(&input)
	if err != nil {
		http.Error(rw, "Invalid JSON", http.StatusBadRequest)
		return
	}

	userIDSring, ok := middlewares.UserIdFromContext(req.Context())
	if !ok {
		http.Error(rw, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var userId pgtype.UUID
	err = userId.Scan(userIDSring)
	if err != nil {
		http.Error(rw, fmt.Sprintf("Failed to parse user ID: %v", err), http.StatusInternalServerError)
		return
	}

	updateUser, err := h.authServise.UpdateUser(req.Context(), userIDSring, input.Name, input.Email)
	if err != nil {
		http.Error(rw, "Failed to update user", http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(http.StatusOK)

	err = json.NewEncoder(rw).Encode(UpdateUserResponse{
		ID:        updateUser.ID,
		Name:      updateUser.Name,
		Email:     updateUser.Email,
		UpdatedAt: updateUser.UpdatedAt.Format(time.RFC3339),
	})
	if err != nil {
		http.Error(rw, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}
