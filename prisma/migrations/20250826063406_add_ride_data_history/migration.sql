-- AlterTable
ALTER TABLE "public"."ride_wait_time_snapshots" ALTER COLUMN "ride_id" DROP NOT NULL,
ALTER COLUMN "ride_id" SET DATA TYPE BIGINT,
ALTER COLUMN "wait_time" DROP NOT NULL,
ALTER COLUMN "wait_time" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "public"."ride_data_history" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "park_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "operating_hours" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "standby_wait_time" INTEGER,
    "return_time_state" TEXT,
    "return_start" TIMESTAMP(3),
    "return_end" TIMESTAMP(3),
    "forecast" JSONB[] DEFAULT ARRAY[]::JSONB[],

    CONSTRAINT "ride_data_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ride_data_history_park_id_idx" ON "public"."ride_data_history"("park_id");

-- CreateIndex
CREATE INDEX "ride_data_history_entity_type_idx" ON "public"."ride_data_history"("entity_type");

-- CreateIndex
CREATE INDEX "ride_data_history_status_idx" ON "public"."ride_data_history"("status");

-- CreateIndex
CREATE INDEX "ride_data_history_last_updated_idx" ON "public"."ride_data_history"("last_updated");
