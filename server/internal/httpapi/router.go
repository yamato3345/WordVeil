package httpapi

import (
	"net/http"
	"wordveil/server/internal/httpapi/handlers"
	http_health_handler "wordveil/server/internal/httpapi/handlers"
	"wordveil/server/internal/httpapi/middlewares"
)

func NewRouter(userHandler *handlers.Userhandler) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /main/", http_health_handler.HealthHandler)
	mux.HandleFunc("POST /register/", userHandler.RegisterUserHandler)
	mux.HandleFunc("POST /login/", userHandler.Loginhandler)
	mux.Handle(
		"GET /user/",
		middlewares.AuthMiddleware(
			http.HandlerFunc(userHandler.GetUserHandler),
		),
	)
	mux.Handle(
		"PATCH /update/",
		middlewares.AuthMiddleware(
			http.HandlerFunc(userHandler.UpdateUserHandler),
		),
	)
	mux.Handle(
		"DELETE /delete/",
		middlewares.AuthMiddleware(
			http.HandlerFunc(userHandler.DeleteUser),
		),
	)

	return mux
}
