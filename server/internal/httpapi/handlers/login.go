package handlers

import (
	"encoding/json"
	"net/http"
)

type LoginUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Userhandler) Loginhandler(rw http.ResponseWriter, req *http.Request) {
	input := LoginUserRequest{}
	err := json.NewDecoder(req.Body).Decode(&input)
	if err != nil {
		http.Error(rw, "Invalid JSON", http.StatusBadRequest)
		return
	}

	accessToken, err := h.authServise.LoginUser(req.Context(), input.Email, input.Password)
	if err != nil {
		http.Error(rw, "Invalid token", http.StatusBadRequest)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(http.StatusOK)

	err = json.NewEncoder(rw).Encode(map[string]string{"accessToken": accessToken})
	if err != nil {
		http.Error(rw, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}
