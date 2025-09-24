-- AlterTable
ALTER TABLE "public"."broken_sign" ADD COLUMN     "mlConfidence" DOUBLE PRECISION,
ADD COLUMN     "mlDetections" TEXT,
ADD COLUMN     "mlPriority" VARCHAR(50),
ADD COLUMN     "totalDetections" INTEGER;

-- AlterTable
ALTER TABLE "public"."fallen_tree" ADD COLUMN     "mlConfidence" DOUBLE PRECISION,
ADD COLUMN     "mlDetections" TEXT,
ADD COLUMN     "mlPriority" VARCHAR(50),
ADD COLUMN     "totalDetections" INTEGER;

-- AlterTable
ALTER TABLE "public"."garbage" ADD COLUMN     "mlConfidence" DOUBLE PRECISION,
ADD COLUMN     "mlDetections" TEXT,
ADD COLUMN     "mlPriority" VARCHAR(50),
ADD COLUMN     "totalDetections" INTEGER;

-- AlterTable
ALTER TABLE "public"."graffiti" ADD COLUMN     "mlConfidence" DOUBLE PRECISION,
ADD COLUMN     "mlDetections" TEXT,
ADD COLUMN     "mlPriority" VARCHAR(50),
ADD COLUMN     "totalDetections" INTEGER;

-- AlterTable
ALTER TABLE "public"."pothole" ADD COLUMN     "mlConfidence" DOUBLE PRECISION,
ADD COLUMN     "mlDetections" TEXT,
ADD COLUMN     "mlPriority" VARCHAR(50),
ADD COLUMN     "totalDetections" INTEGER;

-- AlterTable
ALTER TABLE "public"."street_light" ADD COLUMN     "mlConfidence" DOUBLE PRECISION,
ADD COLUMN     "mlDetections" TEXT,
ADD COLUMN     "mlPriority" VARCHAR(50),
ADD COLUMN     "totalDetections" INTEGER;
