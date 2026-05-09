-- DropIndex
DROP INDEX "public"."ride_data_history_external_id_park_id_idx";

-- DropTable
DROP TABLE "public"."ride_wait_time_snapshots";

-- CreateIndex
CREATE INDEX "ride_data_history_external_id_idx" ON "public"."ride_data_history"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "ride_data_history_ride_id_last_updated_key" ON "public"."ride_data_history"("ride_id", "last_updated");
