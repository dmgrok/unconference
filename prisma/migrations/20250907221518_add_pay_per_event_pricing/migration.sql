-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 50,
    "allowGuestAccess" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "statusReason" TEXT,
    "paymentType" TEXT NOT NULL DEFAULT 'SUBSCRIPTION',
    "paymentStatus" TEXT NOT NULL DEFAULT 'FREE',
    "stripePaymentId" TEXT,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "maxVotesPerTopic" INTEGER NOT NULL DEFAULT 12,
    "maxTopicsPerRound" INTEGER NOT NULL DEFAULT 10,
    "defaultRoundDuration" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_events" ("allowGuestAccess", "code", "createdAt", "defaultRoundDuration", "description", "endsAt", "id", "maxParticipants", "maxTopicsPerRound", "maxVotesPerTopic", "ownerId", "requireApproval", "startsAt", "status", "statusReason", "title", "updatedAt") SELECT "allowGuestAccess", "code", "createdAt", "defaultRoundDuration", "description", "endsAt", "id", "maxParticipants", "maxTopicsPerRound", "maxVotesPerTopic", "ownerId", "requireApproval", "startsAt", "status", "statusReason", "title", "updatedAt" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE UNIQUE INDEX "events_code_key" ON "events"("code");
CREATE UNIQUE INDEX "events_stripePaymentId_key" ON "events"("stripePaymentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
