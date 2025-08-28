package service

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"
)

type logEntry struct {
	Timestamp string                 `json:"timestamp"`
	Severity  string                 `json:"severity"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
}

var useJSON bool

func init() {
	// Default to JSON logs unless explicitly disabled or in dev env.
	v := strings.ToLower(strings.TrimSpace(os.Getenv("LOG_JSON")))
	if v == "" {
		// detect common dev env markers
		if strings.ToLower(os.Getenv("ENV")) == "development" {
			useJSON = false
		} else {
			useJSON = true
		}
	} else {
		// accept "false", "0", "no" to disable JSON
		useJSON = !(v == "false" || v == "0" || v == "no")
	}
}

func logJSON(severity, msg string, fields map[string]interface{}) {
	if !useJSON {
		timestampUTC := time.Now().UTC().Format(time.RFC3339Nano)
		var fieldParts []string
		for k, v := range fields {
			fieldParts = append(fieldParts, fmt.Sprintf("%s=%v", k, v))
		}
		line := fmt.Sprintf("%s %s: %s", timestampUTC, severity, msg)
		if len(fieldParts) > 0 {
			line = fmt.Sprintf("%s [%s]", line, strings.Join(fieldParts, " "))
		}
		// send ERROR/CRITICAL to stderr
		if severity == "ERROR" || severity == "CRITICAL" || severity == "FATAL" {
			os.Stderr.Write(append([]byte(line), '\n'))
			return
		}
		os.Stdout.Write(append([]byte(line), '\n'))
		return
	}

	entry := logEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Severity:  severity,
		Message:   msg,
		Fields:    fields,
	}
	b, _ := json.Marshal(entry)
	// send ERROR/CRITICAL to stderr so Cloud Logging treats as error severity
	if severity == "ERROR" || severity == "CRITICAL" {
		os.Stderr.Write(append(b, '\n'))
		return
	}
	os.Stdout.Write(append(b, '\n'))
}

func Infof(format string, args ...interface{}) {
	logJSON("INFO", fmt.Sprintf(format, args...), nil)
}

func Debugf(format string, args ...interface{}) {
	logJSON("DEBUG", fmt.Sprintf(format, args...), nil)
}

func Warnf(format string, args ...interface{}) {
	logJSON("WARN", fmt.Sprintf(format, args...), nil)
}

func Errorf(format string, args ...interface{}) {
	logJSON("ERROR", fmt.Sprintf(format, args...), nil)
}

func Fatalf(format string, args ...interface{}) {
	logJSON("FATAL", fmt.Sprintf(format, args...), nil)
}

func Fatal(args ...interface{}) {
	logJSON("FATAL", fmt.Sprint(args...), nil)
	os.Exit(1)
}

type Logger interface {
	Infof(format string, args ...interface{})
	Debugf(format string, args ...interface{})
	Warnf(format string, args ...interface{})
	Errorf(format string, args ...interface{})
	Fatalf(format string, args ...interface{})
	Fatal(args ...interface{})
}

// defaultLogger implements Logger by delegating to the package functions.
type defaultLogger struct{}

func NewDefaultLogger() Logger {
	return &defaultLogger{}
}

func (l *defaultLogger) Infof(format string, args ...interface{}) {
	Infof(format, args...)
}

func (l *defaultLogger) Debugf(format string, args ...interface{}) {
	Debugf(format, args...)
}

func (l *defaultLogger) Warnf(format string, args ...interface{}) {
	Warnf(format, args...)
}

func (l *defaultLogger) Errorf(format string, args ...interface{}) {
	Errorf(format, args...)
}

func (l *defaultLogger) Fatalf(format string, args ...interface{}) {
	Fatalf(format, args...)
}

func (l *defaultLogger) Fatal(args ...interface{}) {
	Fatal(args...)
}
