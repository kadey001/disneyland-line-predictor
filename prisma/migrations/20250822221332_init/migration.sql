-- CreateTable
CREATE TABLE "public"."ride_wait_time_snapshots" (
    "id" SERIAL NOT NULL,
    "ride_id" INTEGER NOT NULL,
    "ride_name" TEXT NOT NULL,
    "is_open" BOOLEAN NOT NULL,
    "wait_time" INTEGER NOT NULL,
    "snapshot_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_wait_time_snapshots_pkey" PRIMARY KEY ("id")
);
