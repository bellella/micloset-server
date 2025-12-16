/*
  Warnings:

  - You are about to drop the column `shopifyAccessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `shopifyAccessTokenExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `shopifyPasswordHash` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "shopifyAccessToken",
DROP COLUMN "shopifyAccessTokenExpiresAt",
DROP COLUMN "shopifyPasswordHash";
