/*
  Warnings:

  - You are about to drop the column `storachaDID` on the `broken_sign` table. All the data in the column will be lost.
  - You are about to drop the column `storachaDID` on the `fallen_tree` table. All the data in the column will be lost.
  - You are about to drop the column `storachaDID` on the `garbage` table. All the data in the column will be lost.
  - You are about to drop the column `storachaDID` on the `graffiti` table. All the data in the column will be lost.
  - You are about to drop the column `storachaDID` on the `pothole` table. All the data in the column will be lost.
  - You are about to drop the column `storachaDID` on the `street_light` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNo]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `heliaDID` to the `broken_sign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `heliaDID` to the `fallen_tree` table without a default value. This is not possible if the table is not empty.
  - Added the required column `heliaDID` to the `garbage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `heliaDID` to the `graffiti` table without a default value. This is not possible if the table is not empty.
  - Added the required column `heliaDID` to the `pothole` table without a default value. This is not possible if the table is not empty.
  - Added the required column `heliaDID` to the `street_light` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNo` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."broken_sign" DROP COLUMN "storachaDID",
ADD COLUMN     "heliaDID" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "public"."fallen_tree" DROP COLUMN "storachaDID",
ADD COLUMN     "heliaDID" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "public"."garbage" DROP COLUMN "storachaDID",
ADD COLUMN     "heliaDID" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "public"."graffiti" DROP COLUMN "storachaDID",
ADD COLUMN     "heliaDID" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "public"."pothole" DROP COLUMN "storachaDID",
ADD COLUMN     "heliaDID" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "public"."street_light" DROP COLUMN "storachaDID",
ADD COLUMN     "heliaDID" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phoneNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNo_key" ON "public"."users"("phoneNo");
