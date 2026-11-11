package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS(t *testing.T) {
	for _, tc := range []struct {
		name, origin, config, method, requestedMethod, headers string
		status                                                 int
		called                                                 bool
	}{
		{"vite preflight", "http://localhost:1430", "", "OPTIONS", "POST", "content-type", 204, false},
		{"tauri preflight", "tauri://localhost", "", "OPTIONS", "GET", "authorization", 204, false},
		{"tauri windows", "http://tauri.localhost", "", "GET", "", "", 401, true},
		{"tauri https", "https://tauri.localhost", "", "GET", "", "", 401, true},
		{"unknown origin", "https://unknown.example", "", "GET", "", "", 403, false},
		{"custom origin", "https://app.example", " https://app.example ", "GET", "", "", 401, true},
		{"defaults replaced", "http://localhost:1430", "https://app.example", "GET", "", "", 403, false},
		{"unsupported method", "http://localhost:1430", "", "OPTIONS", "DELETE", "", 405, false},
		{"unsupported header", "http://localhost:1430", "", "OPTIONS", "POST", "x-custom", 403, false},
		{"no origin", "", "", "GET", "", "", 401, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			called := false
			handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				called = true
				w.WriteHeader(http.StatusUnauthorized)
			}), tc.config)
			r := httptest.NewRequest(tc.method, "/user/", nil)
			r.Header.Set("Origin", tc.origin)
			r.Header.Set("Access-Control-Request-Method", tc.requestedMethod)
			r.Header.Set("Access-Control-Request-Headers", tc.headers)
			w := httptest.NewRecorder()
			handler.ServeHTTP(w, r)
			if w.Code != tc.status || called != tc.called {
				t.Fatalf("status=%d called=%v; want %d %v", w.Code, called, tc.status, tc.called)
			}
			if tc.origin != "" && (tc.called || tc.status == 204) && w.Header().Get("Access-Control-Allow-Origin") != tc.origin {
				t.Fatal("missing allowed origin, including on authentication errors")
			}
			if tc.status == 204 && w.Header().Get("Access-Control-Allow-Headers") != "Content-Type, Authorization" {
				t.Fatal("missing preflight headers")
			}
		})
	}
}
