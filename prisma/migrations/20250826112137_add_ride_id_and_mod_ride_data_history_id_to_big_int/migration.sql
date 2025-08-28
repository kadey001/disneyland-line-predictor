/*
  Warnings:

  - The primary key for the `ride_data_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ride_data_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `operating_hours` column on the `ride_data_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `forecast` column on the `ride_data_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[external_id,park_id]` on the table `ride_data_history` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ride_id` to the `ride_data_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ride_data_history" DROP CONSTRAINT "ride_data_history_pkey",
ADD COLUMN     "ride_id" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
DROP COLUMN "operating_hours",
ADD COLUMN     "operating_hours" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN "forecast",
ADD COLUMN     "forecast" JSONB NOT NULL DEFAULT '[]',
ADD CONSTRAINT "ride_data_history_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "ride_data_history_ride_id_idx" ON "public"."ride_data_history"("ride_id");

-- CreateIndex
CREATE UNIQUE INDEX "ride_data_history_external_id_park_id_key" ON "public"."ride_data_history"("external_id", "park_id");
