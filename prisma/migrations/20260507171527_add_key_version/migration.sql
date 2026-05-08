-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FileRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "encryptedContentBefore" TEXT,
    "encryptedContentAfter" TEXT NOT NULL,
    "contentSha256Before" TEXT,
    "contentSha256After" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "changeSummary" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileRevision_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "VaultFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FileRevision_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FileRevision" ("changeSummary", "changedAt", "changedById", "contentSha256After", "contentSha256Before", "encryptedContentAfter", "encryptedContentBefore", "fileId", "id", "revisionNumber") SELECT "changeSummary", "changedAt", "changedById", "contentSha256After", "contentSha256Before", "encryptedContentAfter", "encryptedContentBefore", "fileId", "id", "revisionNumber" FROM "FileRevision";
DROP TABLE "FileRevision";
ALTER TABLE "new_FileRevision" RENAME TO "FileRevision";
CREATE INDEX "FileRevision_fileId_idx" ON "FileRevision"("fileId");
CREATE INDEX "FileRevision_changedById_idx" ON "FileRevision"("changedById");
CREATE UNIQUE INDEX "FileRevision_fileId_revisionNumber_key" ON "FileRevision"("fileId", "revisionNumber");
CREATE TABLE "new_VaultFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "actualFileName" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "categoryId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "VaultFile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VaultFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VaultFile_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VaultFile" ("actualFileName", "categoryId", "contentSha256", "contentType", "createdAt", "createdById", "deletedAt", "encryptedContent", "id", "title", "updatedAt", "updatedById") SELECT "actualFileName", "categoryId", "contentSha256", "contentType", "createdAt", "createdById", "deletedAt", "encryptedContent", "id", "title", "updatedAt", "updatedById" FROM "VaultFile";
DROP TABLE "VaultFile";
ALTER TABLE "new_VaultFile" RENAME TO "VaultFile";
CREATE INDEX "VaultFile_deletedAt_idx" ON "VaultFile"("deletedAt");
CREATE INDEX "VaultFile_contentType_idx" ON "VaultFile"("contentType");
CREATE INDEX "VaultFile_createdById_idx" ON "VaultFile"("createdById");
CREATE INDEX "VaultFile_updatedById_idx" ON "VaultFile"("updatedById");
CREATE INDEX "VaultFile_categoryId_idx" ON "VaultFile"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
