/*
  Warnings:

  - You are about to drop the column `s3URL` on the `pothole` table. All the data in the column will be lost.
  - Added the required column `finalS3URL` to the `pothole` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalS3URL` to the `pothole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."pothole" DROP COLUMN "s3URL",
ADD COLUMN     "finalS3URL" VARCHAR(255) NOT NULL,
ADD COLUMN     "originalS3URL" VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE "public"."garbage" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "originalS3URL" VARCHAR(255) NOT NULL,
    "finalS3URL" VARCHAR(255) NOT NULL,
    "storachaDID" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garbage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fallen_tree" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "originalS3URL" VARCHAR(255) NOT NULL,
    "finalS3URL" VARCHAR(255) NOT NULL,
    "storachaDID" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fallen_tree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."broken_sign" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "originalS3URL" VARCHAR(255) NOT NULL,
    "finalS3URL" VARCHAR(255) NOT NULL,
    "storachaDID" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broken_sign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."street_light" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "originalS3URL" VARCHAR(255) NOT NULL,
    "finalS3URL" VARCHAR(255) NOT NULL,
    "storachaDID" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "street_light_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."graffiti" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "originalS3URL" VARCHAR(255) NOT NULL,
    "finalS3URL" VARCHAR(255) NOT NULL,
    "storachaDID" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graffiti_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."garbage" ADD CONSTRAINT "garbage_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fallen_tree" ADD CONSTRAINT "fallen_tree_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."broken_sign" ADD CONSTRAINT "broken_sign_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."street_light" ADD CONSTRAINT "street_light_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graffiti" ADD CONSTRAINT "graffiti_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
