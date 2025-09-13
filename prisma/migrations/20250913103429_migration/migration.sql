-- CreateTable
CREATE TABLE "event_connections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "sharedTopics" TEXT,
    "collaboratedOn" TEXT,
    "contactExchanged" BOOLEAN NOT NULL DEFAULT false,
    "connectionStrength" INTEGER NOT NULL DEFAULT 1,
    "meetingNotes" TEXT,
    "followUpPlanned" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_connections_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "event_connections_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collaboration_spaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "topicId" TEXT,
    "roomId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contributors" TEXT,
    "sharedNotes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "collaboration_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collaborationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'LINK',
    "addedBy" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collaboration_resources_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "collaboration_spaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collaborationId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "action_items_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "collaboration_spaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_showcases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contributors" TEXT,
    "skillsUsed" TEXT,
    "skillsNeeded" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEATION',
    "contactEmail" TEXT,
    "repositoryUrl" TEXT,
    "demoUrl" TEXT,
    "images" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'mdi-trophy',
    "badgeUrl" TEXT,
    "eventId" TEXT,
    "metadata" TEXT,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "introduction_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "commonInterests" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "facilitatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "introduction_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "introduction_requests_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "skills" TEXT,
    "compatibilityScore" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "skill_matches_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "skill_matches_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "bio" TEXT,
    "skills" TEXT,
    "interests" TEXT,
    "lookingFor" TEXT,
    "linkedinUrl" TEXT,
    "twitterHandle" TEXT,
    "websiteUrl" TEXT,
    "allowContactSharing" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_users" ("avatar", "createdAt", "customerId", "email", "emailVerifyExpires", "emailVerifyPin", "githubId", "globalRole", "googleId", "id", "isActive", "isEmailVerified", "isGuest", "lastLoginAt", "name", "nickname", "participantLimit", "passwordHash", "subscriptionEnd", "subscriptionId", "subscriptionStart", "subscriptionStatus", "subscriptionTier", "updatedAt") SELECT "avatar", "createdAt", "customerId", "email", "emailVerifyExpires", "emailVerifyPin", "githubId", "globalRole", "googleId", "id", "isActive", "isEmailVerified", "isGuest", "lastLoginAt", "name", "nickname", "participantLimit", "passwordHash", "subscriptionEnd", "subscriptionId", "subscriptionStart", "subscriptionStatus", "subscriptionTier", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "users_subscriptionId_key" ON "users"("subscriptionId");
CREATE UNIQUE INDEX "users_customerId_key" ON "users"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "event_connections_eventId_participantAId_participantBId_key" ON "event_connections"("eventId", "participantAId", "participantBId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementType_name_eventId_key" ON "user_achievements"("userId", "achievementType", "name", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_matches_eventId_personAId_personBId_key" ON "skill_matches"("eventId", "personAId", "personBId");
