/*
  Warnings:

  - A unique constraint covering the columns `[linkedinId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[twitterId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailPreferences" TEXT DEFAULT '{"eventSummaries":true,"collaborationReminders":true,"networkingFollowUp":true,"weeklyDigest":true,"eventInvitations":true}';
ALTER TABLE "users" ADD COLUMN "linkedinId" TEXT;
ALTER TABLE "users" ADD COLUMN "twitterId" TEXT;

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "connectedUserId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL DEFAULT 50,
    "connectionStrength" TEXT NOT NULL DEFAULT 'WEAK',
    "conversationTopics" TEXT,
    "sharedInterests" TEXT,
    "mutualGoals" TEXT,
    "followUpStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "lastContactDate" DATETIME,
    "nextFollowUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "connections_connectedUserId_fkey" FOREIGN KEY ("connectedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "connection_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "connection_notes_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "follow_up_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follow_up_tasks_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "connection_collaborations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "outcome" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "connection_collaborations_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconEmoji" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    CONSTRAINT "achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "networking_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "networking_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "eventId" TEXT,
    "sessionId" TEXT,
    "properties" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- CreateTable
CREATE TABLE "event_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "totalConnections" INTEGER NOT NULL DEFAULT 0,
    "totalCollaborations" INTEGER NOT NULL DEFAULT 0,
    "avgConnectionQuality" REAL NOT NULL DEFAULT 0,
    "participantRetention" REAL NOT NULL DEFAULT 0,
    "engagementScore" REAL NOT NULL DEFAULT 0,
    "successScore" REAL NOT NULL DEFAULT 0,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_engagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "timeOnPlatform" INTEGER NOT NULL DEFAULT 0,
    "actionsCount" INTEGER NOT NULL DEFAULT 0,
    "connectionsMade" INTEGER NOT NULL DEFAULT 0,
    "followUpsCompleted" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "analytics_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "filters" TEXT,
    "data" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "connections_userId_connectedUserId_eventId_key" ON "connections"("userId", "connectedUserId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_analytics_eventId_key" ON "event_analytics"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "user_engagement_userId_eventId_date_key" ON "user_engagement"("userId", "eventId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "users_linkedinId_key" ON "users"("linkedinId");

-- CreateIndex
CREATE UNIQUE INDEX "users_twitterId_key" ON "users"("twitterId");
