ALTER TABLE "UserProfile"
ADD COLUMN "wakeTime" TEXT,
ADD COLUMN "sleepTime" TEXT,
ADD COLUMN "workType" TEXT,
ADD COLUMN "hardEatingDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "targetWeightKilograms" DOUBLE PRECISION,
ADD COLUMN "desiredPace" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN "appetiteMorning" TEXT,
ADD COLUMN "appetiteNight" TEXT,
ADD COLUMN "bestAppetiteTime" TEXT,
ADD COLUMN "worstAppetiteTime" TEXT,
ADD COLUMN "volumeTolerance" TEXT,
ADD COLUMN "avoidedTextures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "preferredTextureStyle" TEXT,
ADD COLUMN "nauseaFoods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "safeFoods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "favoriteFoods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "dislikedFoods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "allergies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "dietType" TEXT NOT NULL DEFAULT 'omnivore',
ADD COLUMN "planMode" TEXT NOT NULL DEFAULT 'clean_bulking';

ALTER TABLE "TrainingRoutine"
ADD COLUMN "trainingDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "trainingTime" TEXT,
ADD COLUMN "trainingIntensity" TEXT NOT NULL DEFAULT 'moderate',
ADD COLUMN "restDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
