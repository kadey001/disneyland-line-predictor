package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestHealthHandler(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		expectedStatus int
	}{
		{
			name:           "GET request",
			method:         "GET",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "POST request",
			method:         "POST",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/health", nil)
			w := httptest.NewRecorder()

			healthHandler(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			var response HealthResponse
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Errorf("Failed to unmarshal response: %v", err)
			}

			if response.Status != "healthy" {
				t.Errorf("Expected status 'healthy', got '%s'", response.Status)
			}

			if response.Service != ServiceName {
				t.Errorf("Expected service '%s', got '%s'", ServiceName, response.Service)
			}
		})
	}
}

func TestRootHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()

	rootHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response ServiceInfo
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to unmarshal response: %v", err)
	}

	if response.Service != ServiceName {
		t.Errorf("Expected service '%s', got '%s'", ServiceName, response.Service)
	}

	if response.Version != ServiceVersion {
		t.Errorf("Expected version '%s', got '%s'", ServiceVersion, response.Version)
	}

	if len(response.Endpoints) == 0 {
		t.Error("Expected endpoints to be populated")
	}

	if response.Status != "running" {
		t.Errorf("Expected status 'running', got '%s'", response.Status)
	}
}

func TestCORSHeaders(t *testing.T) {
	// Test allowed origin
	req := httptest.NewRequest("OPTIONS", "/wait-times", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	w := httptest.NewRecorder()

	// We need to create a mock handler that includes CORS logic
	// For now, just test that the handler doesn't panic
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate CORS logic from waitTimesHandler
		origin := r.Header.Get("Origin")
		if AllowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
	})

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	expectedOrigin := "http://localhost:3000"
	actualOrigin := w.Header().Get("Access-Control-Allow-Origin")
	if actualOrigin != expectedOrigin {
		t.Errorf("Expected CORS origin '%s', got '%s'", expectedOrigin, actualOrigin)
	}
}

func TestAllowedOrigins(t *testing.T) {
	tests := []struct {
		origin   string
		expected bool
	}{
		{"https://disneyland-line-predictor.vercel.app", true},
		{"http://localhost:3000", true},
		{"https://malicious-site.com", false},
		{"", false},
	}

	for _, tt := range tests {
		t.Run(tt.origin, func(t *testing.T) {
			result := AllowedOrigins[tt.origin]
			if result != tt.expected {
				t.Errorf("Origin '%s': expected %v, got %v", tt.origin, tt.expected, result)
			}
		})
	}
}

func TestConstants(t *testing.T) {
	if ServiceName != "wait-times-api" {
		t.Errorf("Expected ServiceName 'wait-times-api', got '%s'", ServiceName)
	}

	if ServiceVersion != "1.0.0" {
		t.Errorf("Expected ServiceVersion '1.0.0', got '%s'", ServiceVersion)
	}

	if DataHours != 24*time.Hour {
		t.Errorf("Expected DataHours to be 24 hours")
	}

	if RequestTimeout != 30*time.Second {
		t.Errorf("Expected RequestTimeout to be 30 seconds")
	}
}

func TestWaitTimesHandler_MethodNotAllowed(t *testing.T) {
	// Note: This test would require a proper mock repository
	// For now, we'll skip the full handler test since it requires database setup
	t.Skip("Skipping handler test that requires database repository")
}
