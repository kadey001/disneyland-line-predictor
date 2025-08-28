package response

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

// Options configures the response behavior
type Options struct {
	// CacheMaxAge sets the max-age for Cache-Control header (in seconds)
	CacheMaxAge int
	// EnableGzip enables gzip compression if client supports it
	EnableGzip bool
	// EnableETag enables ETag generation and conditional responses
	EnableETag bool
}

// DefaultOptions provides sensible defaults for API responses
var DefaultOptions = Options{
	CacheMaxAge: 120, // 2 minutes
	EnableGzip:  true,
	EnableETag:  true,
}

// WriteJSON writes a JSON response with optional caching, compression, and conditional handling
func WriteJSON(w http.ResponseWriter, r *http.Request, data interface{}, opts *Options) error {
	if opts == nil {
		opts = &DefaultOptions
	}

	// Marshal to JSON first
	respBytes, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// Generate ETag if enabled
	var etag string
	if opts.EnableETag {
		etag = fmt.Sprintf("\"%x\"", sha256.Sum256(respBytes))

		// Check If-None-Match for conditional response
		if match := r.Header.Get("If-None-Match"); match != "" && match == etag {
			w.WriteHeader(http.StatusNotModified)
			return nil
		}
	}

	// Set standard headers
	w.Header().Set("Content-Type", "application/json")

	// Set cache headers if configured
	if opts.CacheMaxAge > 0 {
		w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d, s-maxage=%d", opts.CacheMaxAge, opts.CacheMaxAge))
	}

	// Set ETag header if enabled
	if opts.EnableETag && etag != "" {
		w.Header().Set("ETag", etag)
	}

	// Set Vary header for compression
	if opts.EnableGzip {
		w.Header().Set("Vary", "Accept-Encoding")
	}

	// Handle gzip compression if enabled and client supports it
	if opts.EnableGzip && strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
		var buf bytes.Buffer
		gzw := gzip.NewWriter(&buf)
		if _, err := gzw.Write(respBytes); err != nil {
			gzw.Close()
			return fmt.Errorf("failed to gzip response: %w", err)
		}
		gzw.Close()

		w.Header().Set("Content-Encoding", "gzip")
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write(buf.Bytes()); err != nil {
			return fmt.Errorf("failed to write gzipped response: %w", err)
		}
		return nil
	}

	// Write uncompressed response
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write(respBytes); err != nil {
		return fmt.Errorf("failed to write response: %w", err)
	}

	return nil
}

// WriteJSONWithDefaults writes a JSON response using default options
func WriteJSONWithDefaults(w http.ResponseWriter, r *http.Request, data interface{}) error {
	return WriteJSON(w, r, data, &DefaultOptions)
}

// WriteError writes a JSON error response
func WriteError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	errorResp := map[string]interface{}{
		"error":   true,
		"message": message,
		"status":  statusCode,
	}

	if err := json.NewEncoder(w).Encode(errorResp); err != nil {
		log.Printf("Failed to encode error response: %v", err)
	}
}
