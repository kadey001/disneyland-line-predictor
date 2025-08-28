# Build stage
FROM golang:1.23-alpine AS builder

# Install git and ca-certificates in a single layer
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first for better layer caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application with optimized flags
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s -extldflags '-static'" \
    -a -installsuffix cgo \
    -o wait-times-api \
    ./wait-times-api

# Final stage
FROM alpine:3.21

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Switch to non-root user
USER appuser

WORKDIR /home/appuser/

# Copy the binary from builder stage
COPY --from=builder /app/wait-times-api .

# Expose port
EXPOSE 8080

# Use exec form for better signal handling
ENTRYPOINT ["./wait-times-api"]
