# Multi-stage build for live-data-collector

# Build stage
FROM golang:1.21-alpine AS build
WORKDIR /src

# Install git for module downloads
RUN apk add --no-cache git

# Copy only go files first for faster rebuilds
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build static binary
ENV CGO_ENABLED=0
RUN go build -ldflags "-s -w" -o /usr/local/bin/live-data-collector main.go

# Runtime stage
FROM gcr.io/distroless/static-debian11
COPY --from=build /usr/local/bin/live-data-collector /usr/local/bin/live-data-collector
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/live-data-collector"]
