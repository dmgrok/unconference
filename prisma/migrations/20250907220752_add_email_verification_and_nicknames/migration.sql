-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "nickname" TEXT,
    "passwordHash" TEXT,
    "avatar" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyPin" TEXT,
    "emailVerifyExpires" DATETIME,
    "githubId" TEXT,
    "googleId" TEXT,
    "globalRole" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionId" TEXT,
    "customerId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscriptionStart" DATETIME,
    "subscriptionEnd" DATETIME,
    "participantLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);
INSERT INTO "new_users" ("avatar", "createdAt", "customerId", "email", "githubId", "globalRole", "googleId", "id", "isActive", "isGuest", "lastLoginAt", "name", "participantLimit", "passwordHash", "subscriptionEnd", "subscriptionId", "subscriptionStart", "subscriptionStatus", "subscriptionTier", "updatedAt") SELECT "avatar", "createdAt", "customerId", "email", "githubId", "globalRole", "googleId", "id", "isActive", "isGuest", "lastLoginAt", "name", "participantLimit", "passwordHash", "subscriptionEnd", "subscriptionId", "subscriptionStart", "subscriptionStatus", "subscriptionTier", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "users_subscriptionId_key" ON "users"("subscriptionId");
CREATE UNIQUE INDEX "users_customerId_key" ON "users"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
