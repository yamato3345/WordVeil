package httpapi

import (
	"net/http"
)

func NewServer(addr string, handler http.Handler) *http.Server {
	server := &http.Server{
		Addr:    addr,
		Handler: handler,
	}
	return server
}
