-- DropIndex
DROP INDEX "public"."ride_data_history_external_id_park_id_key";

-- CreateIndex
CREATE INDEX "ride_data_history_external_id_park_id_idx" ON "public"."ride_data_history"("external_id", "park_id");
