-- CreateEnum
CREATE TYPE "MealTime" AS ENUM ('breakfast', 'lunch', 'snack', 'dinner');

-- CreateEnum
CREATE TYPE "FeedbackMood" AS ENUM ('loved', 'neutral', 'could_not_finish');

-- CreateEnum
CREATE TYPE "VolumeLevel" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredTextures" JSONB NOT NULL,
    "preferredVolumes" JSONB NOT NULL,
    "preferredFlavors" JSONB NOT NULL,
    "avoidedIngredients" TEXT[],
    "budgetPreference" TEXT NOT NULL,
    "cookingTimePreference" TEXT NOT NULL,
    "safeMealIds" TEXT[],
    "favoriteMealIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eatingMode" TEXT NOT NULL DEFAULT 'clean_bulking',
    "bodyGoal" TEXT NOT NULL DEFAULT 'lean_gain',
    "dailyWaterTargetMl" INTEGER NOT NULL DEFAULT 2500,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bmr" INTEGER NOT NULL,
    "tdee" INTEGER NOT NULL,
    "calories" INTEGER NOT NULL,
    "proteinGrams" INTEGER NOT NULL,
    "carbsGrams" INTEGER NOT NULL,
    "fatGrams" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NutritionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRoutine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingDaysPerWeek" INTEGER NOT NULL,
    "trainingType" TEXT NOT NULL,
    "preferredTimes" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "maxCookingMinutes" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BudgetProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealSlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealTime" "MealTime" NOT NULL,
    "targetCalories" INTEGER NOT NULL,
    "targetProtein" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mealTime" "MealTime" NOT NULL,
    "caloriesEstimate" INTEGER NOT NULL,
    "proteinEstimate" INTEGER NOT NULL,
    "carbsEstimate" INTEGER,
    "fatEstimate" INTEGER,
    "budget" TEXT NOT NULL,
    "dna" JSONB NOT NULL,
    "isSafeMeal" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "pausedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "mood" "FeedbackMood" NOT NULL,
    "eatenPercentage" INTEGER NOT NULL,
    "mealTime" "MealTime" NOT NULL,
    "hydrationLevel" "VolumeLevel",
    "trainingDay" BOOLEAN,
    "userMood" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "engineVersion" TEXT NOT NULL DEFAULT 'adaptive-weighted-v1',
    "scoringWeightsVersion" TEXT NOT NULL DEFAULT 'score-weights-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlanVersion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "previousContent" JSONB,
    "reason" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "scoringWeightsVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyPlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlanAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "previousVersion" INTEGER NOT NULL,
    "nextVersion" INTEGER NOT NULL,
    "changedMeals" JSONB NOT NULL,
    "previousContent" JSONB NOT NULL,
    "nextContent" JSONB NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "scoringWeightsVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyPlanAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountMilliliters" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKilograms" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX "NutritionTarget_userId_key" ON "NutritionTarget"("userId");
CREATE UNIQUE INDEX "TrainingRoutine_userId_key" ON "TrainingRoutine"("userId");
CREATE UNIQUE INDEX "BudgetProfile_userId_key" ON "BudgetProfile"("userId");
CREATE INDEX "MealSlot_userId_position_idx" ON "MealSlot"("userId", "position");
CREATE INDEX "MealFeedback_userId_occurredAt_idx" ON "MealFeedback"("userId", "occurredAt");
CREATE INDEX "MealFeedback_mealId_occurredAt_idx" ON "MealFeedback"("mealId", "occurredAt");
CREATE INDEX "WeeklyPlan_userId_startsOn_idx" ON "WeeklyPlan"("userId", "startsOn");
CREATE INDEX "DailyPlanVersion_userId_date_idx" ON "DailyPlanVersion"("userId", "date");
CREATE UNIQUE INDEX "DailyPlanVersion_userId_date_version_key" ON "DailyPlanVersion"("userId", "date", "version");
CREATE INDEX "DailyPlanAdjustment_userId_date_idx" ON "DailyPlanAdjustment"("userId", "date");
CREATE INDEX "WaterLog_userId_occurredAt_idx" ON "WaterLog"("userId", "occurredAt");
CREATE INDEX "WeightLog_userId_occurredAt_idx" ON "WeightLog"("userId", "occurredAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NutritionTarget" ADD CONSTRAINT "NutritionTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingRoutine" ADD CONSTRAINT "TrainingRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetProfile" ADD CONSTRAINT "BudgetProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealSlot" ADD CONSTRAINT "MealSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealFeedback" ADD CONSTRAINT "MealFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealFeedback" ADD CONSTRAINT "MealFeedback_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "MealOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyPlanVersion" ADD CONSTRAINT "DailyPlanVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyPlanAdjustment" ADD CONSTRAINT "DailyPlanAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaterLog" ADD CONSTRAINT "WaterLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeightLog" ADD CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
