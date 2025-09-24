-- AlterTable
ALTER TABLE "public"."broken_sign" ADD COLUMN     "country" VARCHAR(255),
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "landmark" VARCHAR(255),
ADD COLUMN     "neighborhood" VARCHAR(255),
ADD COLUMN     "placeId" VARCHAR(255),
ADD COLUMN     "placeTypes" TEXT,
ADD COLUMN     "postalCode" VARCHAR(50),
ADD COLUMN     "roadName" VARCHAR(255),
ADD COLUMN     "state" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."fallen_tree" ADD COLUMN     "country" VARCHAR(255),
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "landmark" VARCHAR(255),
ADD COLUMN     "neighborhood" VARCHAR(255),
ADD COLUMN     "placeId" VARCHAR(255),
ADD COLUMN     "placeTypes" TEXT,
ADD COLUMN     "postalCode" VARCHAR(50),
ADD COLUMN     "roadName" VARCHAR(255),
ADD COLUMN     "state" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."garbage" ADD COLUMN     "country" VARCHAR(255),
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "landmark" VARCHAR(255),
ADD COLUMN     "neighborhood" VARCHAR(255),
ADD COLUMN     "placeId" VARCHAR(255),
ADD COLUMN     "placeTypes" TEXT,
ADD COLUMN     "postalCode" VARCHAR(50),
ADD COLUMN     "roadName" VARCHAR(255),
ADD COLUMN     "state" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."graffiti" ADD COLUMN     "country" VARCHAR(255),
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "landmark" VARCHAR(255),
ADD COLUMN     "neighborhood" VARCHAR(255),
ADD COLUMN     "placeId" VARCHAR(255),
ADD COLUMN     "placeTypes" TEXT,
ADD COLUMN     "postalCode" VARCHAR(50),
ADD COLUMN     "roadName" VARCHAR(255),
ADD COLUMN     "state" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."pothole" ADD COLUMN     "country" VARCHAR(255),
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "landmark" VARCHAR(255),
ADD COLUMN     "neighborhood" VARCHAR(255),
ADD COLUMN     "placeId" VARCHAR(255),
ADD COLUMN     "placeTypes" TEXT,
ADD COLUMN     "postalCode" VARCHAR(50),
ADD COLUMN     "roadName" VARCHAR(255),
ADD COLUMN     "state" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."street_light" ADD COLUMN     "country" VARCHAR(255),
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "landmark" VARCHAR(255),
ADD COLUMN     "neighborhood" VARCHAR(255),
ADD COLUMN     "placeId" VARCHAR(255),
ADD COLUMN     "placeTypes" TEXT,
ADD COLUMN     "postalCode" VARCHAR(50),
ADD COLUMN     "roadName" VARCHAR(255),
ADD COLUMN     "state" VARCHAR(255);
