package app

import (
	"context"
	"fmt"
	"os"
	"time"
	"wordveil/server/internal/config"
	"wordveil/server/internal/httpapi"
	"wordveil/server/internal/httpapi/handlers"
	"wordveil/server/internal/httpapi/middlewares"
	"wordveil/server/internal/services/auth"
	"wordveil/server/internal/storage/postgres"
	"wordveil/server/internal/storage/postgres/db"

	"github.com/joho/godotenv"
)

func App() {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		fmt.Println("Error loading .env:", err)
		return
	}
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		fmt.Println("Error creating PostgreSQL pool:", err)
		return
	}
	defer pool.Close()

	queries := db.New(pool)
	authService := auth.NewService(queries)
	handler := handlers.NewUserHandler(authService)
	router := httpapi.NewRouter(handler)
	server := httpapi.NewServer(cfg.HTTPAddr, middlewares.CORS(router, os.Getenv("CORS_ALLOWED_ORIGINS")))

	err = server.ListenAndServe()
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
