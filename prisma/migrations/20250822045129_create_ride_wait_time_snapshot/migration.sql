-- CreateTable
CREATE TABLE "RideWaitTimeSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rideId" INTEGER NOT NULL,
    "rideName" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL,
    "waitTime" INTEGER NOT NULL,
    "snapshotTime" DATETIME NOT NULL
);
