module live-data-collector

go 1.21

require (
	github.com/GoogleCloudPlatform/functions-framework-go v1.8.1
	gorm.io/driver/postgres v1.5.7 // indirect
	gorm.io/gorm v1.25.10 // indirect
)

replace disneyland-wait-times => ../../

require disneyland-wait-times v0.0.0-00010101000000-000000000000

require (
	github.com/cloudevents/sdk-go/v2 v2.14.0 // indirect
	github.com/google/uuid v1.4.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/pgx/v5 v5.4.3 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/json-iterator/go v1.1.10 // indirect
	github.com/modern-go/concurrent v0.0.0-20180228061459-e0a39a4cb421 // indirect
	github.com/modern-go/reflect2 v0.0.0-20180701023420-4b7aa43c6742 // indirect
	go.uber.org/atomic v1.4.0 // indirect
	go.uber.org/multierr v1.1.0 // indirect
	go.uber.org/zap v1.10.0 // indirect
	golang.org/x/crypto v0.14.0 // indirect
	golang.org/x/text v0.13.0 // indirect
)
