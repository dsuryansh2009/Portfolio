/*
  Warnings:

  - You are about to drop the column `alt` on the `GalleryImage` table. All the data in the column will be lost.
  - You are about to drop the column `focusY` on the `GalleryImage` table. All the data in the column will be lost.
  - You are about to drop the column `folder` on the `GalleryImage` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `GalleryImage` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `GalleryImage` table. All the data in the column will be lost.
  - Added the required column `cloudinaryPublicId` to the `GalleryImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `folderId` to the `GalleryImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `GalleryImage` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "GalleryImage_folder_idx";

-- AlterTable
ALTER TABLE "GalleryImage" DROP COLUMN "alt",
DROP COLUMN "focusY",
DROP COLUMN "folder",
DROP COLUMN "text",
DROP COLUMN "url",
ADD COLUMN     "cloudinaryPublicId" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "folderId" TEXT NOT NULL,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "GalleryFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GalleryFolder_slug_key" ON "GalleryFolder"("slug");

-- CreateIndex
CREATE INDEX "GalleryImage_folderId_idx" ON "GalleryImage"("folderId");

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "GalleryFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
