package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"wordveil/server/internal/services/auth"
)

type RegisterUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterUserResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt time.Time `json:"deletedAt"`
}

type Userhandler struct {
	authServise *auth.Service
}

func NewUserHandler(service *auth.Service) *Userhandler {
	return &Userhandler{
		authServise: service,
	}
}

func (h *Userhandler) RegisterUserHandler(rw http.ResponseWriter, req *http.Request) {
	input := RegisterUserRequest{}
	err := json.NewDecoder(req.Body).Decode(&input)
	if err != nil {
		http.Error(rw, "Invalid JSON", http.StatusBadRequest)
		return
	}
	createdUser, err := h.authServise.CreateUser(req.Context(), input.Name, input.Email, input.Password)
	if err != nil {
		http.Error(rw, "Failed to create user", http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(http.StatusCreated)

	err = json.NewEncoder(rw).Encode(RegisterUserResponse{
		ID:        createdUser.ID,
		Name:      createdUser.Name,
		Email:     createdUser.Email,
		CreatedAt: createdUser.CreatedAt,
	})
	if err != nil {
		http.Error(rw, "Failed to encode response", http.StatusInternalServerError)
	}
}
