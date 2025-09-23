-- CreateTable
CREATE TABLE "public"."pothole" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "s3URL" VARCHAR(255) NOT NULL,
    "storachaDID" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pothole_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."pothole" ADD CONSTRAINT "pothole_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
