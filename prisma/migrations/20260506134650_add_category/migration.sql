-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VaultFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "actualFileName" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "categoryId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "VaultFile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VaultFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VaultFile_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VaultFile" ("actualFileName", "contentSha256", "contentType", "createdAt", "createdById", "deletedAt", "encryptedContent", "id", "title", "updatedAt", "updatedById") SELECT "actualFileName", "contentSha256", "contentType", "createdAt", "createdById", "deletedAt", "encryptedContent", "id", "title", "updatedAt", "updatedById" FROM "VaultFile";
DROP TABLE "VaultFile";
ALTER TABLE "new_VaultFile" RENAME TO "VaultFile";
CREATE INDEX "VaultFile_deletedAt_idx" ON "VaultFile"("deletedAt");
CREATE INDEX "VaultFile_contentType_idx" ON "VaultFile"("contentType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");
