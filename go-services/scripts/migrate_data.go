package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
)

func main() {
	sourceConnStr := "postgresql://postgres:4!s3SI*S75tC*P3w@db.sfgsgxjaovjkepqwgtbf.supabase.co:5432/postgres"
	destConnStr := "postgresql://app:2c2AFxclqlGa1daORt7nAFLA@34.186.178.184:5432/wait_times"

	ctx := context.Background()

	// Connect to Source
	log.Println("Connecting to Supabase (Source)...")
	sourceConn, err := pgx.Connect(ctx, sourceConnStr)
	if err != nil {
		log.Fatalf("Unable to connect to source: %v\n", err)
	}
	defer sourceConn.Close(ctx)

	// Connect to Destination
	log.Println("Connecting to Cloud SQL (Destination)...")
	destConn, err := pgx.Connect(ctx, destConnStr)
	if err != nil {
		log.Fatalf("Unable to connect to destination: %v\n", err)
	}
	defer destConn.Close(ctx)

	// Migrate ride_data_history
	log.Println("Starting migration of ride_data_history...")
	
	// Querying all columns defined in prisma schema
	rows, err := sourceConn.Query(ctx, `
		SELECT 
			ride_id, 
			standby_wait_time, 
			status, 
			last_updated, 
			name, 
			park_id, 
			entity_type, 
			external_id, 
			operating_hours, 
			forecast 
		FROM ride_data_history`)
	if err != nil {
		log.Fatalf("Query failed: %v\n", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var rideID string
		var standbyWaitTime *int
		var status string
		var lastUpdated interface{}
		var name string
		var parkID string
		var entityType string
		var externalID string
		var operatingHours interface{}
		var forecast interface{}

		err := rows.Scan(
			&rideID, 
			&standbyWaitTime, 
			&status, 
			&lastUpdated, 
			&name, 
			&parkID, 
			&entityType, 
			&externalID, 
			&operatingHours, 
			&forecast)
		if err != nil {
			log.Fatalf("Scan failed: %v\n", err)
		}

		_, err = destConn.Exec(ctx, `
			INSERT INTO ride_data_history (
				ride_id, 
				standby_wait_time, 
				status, 
				last_updated, 
				name, 
				park_id, 
				entity_type, 
				external_id, 
				operating_hours, 
				forecast,
				updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
			ON CONFLICT (ride_id, last_updated) DO NOTHING`,
			rideID, standbyWaitTime, status, lastUpdated, name, parkID, entityType, externalID, operatingHours, forecast)
		
		if err != nil {
			log.Printf("Insert failed for ride %s: %v\n", rideID, err)
		}
		
		count++
		if count%100 == 0 {
			fmt.Printf("Migrated %d rows...\n", count)
		}
	}

	log.Printf("Migration complete! Total rows processed: %d\n", count)
}
