package handlers

import (
	"fmt"
	"net/http"
)

func HealthHandler(rw http.ResponseWriter, r *http.Request) {
	rw.WriteHeader(http.StatusOK)
	fmt.Fprintf(rw, "OK")
}
