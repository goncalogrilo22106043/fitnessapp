CREATE TABLE "RoutineProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileVersion" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT,
    "age" INTEGER,
    "sex" TEXT,
    "heightCm" INTEGER,
    "currentWeightKg" DOUBLE PRECISION,
    "goalWeightKg" DOUBLE PRECISION,
    "bodyGoal" TEXT,
    "desiredPace" TEXT,
    "completedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoutineProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkRoutine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wakeTime" TEXT,
    "usualBedTime" TEXT,
    "sleepDurationEstimate" DOUBLE PRECISION,
    "weekdayRoutineDifferentFromWeekend" BOOLEAN NOT NULL DEFAULT false,
    "weekendWakeTime" TEXT,
    "weekendBedTime" TEXT,
    "workType" TEXT,
    "workStartTime" TEXT,
    "workEndTime" TEXT,
    "workDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "breaksAvailable" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canEatAtWork" BOOLEAN,
    "accessToKitchenAtWork" BOOLEAN,
    "activityLevel" TEXT,
    "averageDailySteps" INTEGER,
    "commuteDurationMinutes" INTEGER,
    "commuteType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkRoutine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MealSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "breakfastTime" TEXT,
    "morningSnackTime" TEXT,
    "lunchTime" TEXT,
    "afternoonSnackTime" TEXT,
    "dinnerTime" TEXT,
    "supperTime" TEXT,
    "mealTimeFlexibility" JSONB NOT NULL DEFAULT '{}',
    "mealsUsuallySkipped" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mealsHardestToFinish" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weekendMealTimesDifferent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MealSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "daysOfWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startTime" TEXT,
    "durationMinutes" INTEGER,
    "intensity" TEXT,
    "location" TEXT,
    "preWorkoutMealLeadMinutes" INTEGER,
    "postWorkoutMealWindowMinutes" INTEGER,
    "appetiteAfterTraining" TEXT,
    "isFlexibleTime" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppetiteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appetiteOnWaking" TEXT,
    "appetiteMorning" TEXT,
    "appetiteLunch" TEXT,
    "appetiteAfternoon" TEXT,
    "appetiteDinner" TEXT,
    "appetiteNight" TEXT,
    "bestAppetiteWindow" TEXT,
    "worstAppetiteWindow" TEXT,
    "volumeTolerance" TEXT,
    "eatingSpeed" TEXT,
    "needsLongMealTime" BOOLEAN,
    "preferredMealTemperature" TEXT,
    "platePreference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppetiteProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodToleranceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avoidedTextures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredTextures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "toleratedTemperatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoidedTemperatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nauseaFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "temporaryFatigueFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "safeFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favoriteFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dislikedFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FoodToleranceProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LifestylePreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietType" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intolerances" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cookingSkill" TEXT,
    "cookingTimeWeekdayMinutes" INTEGER,
    "cookingTimeWeekendMinutes" INTEGER,
    "batchCookingAvailable" BOOLEAN,
    "budgetLevel" TEXT,
    "mealsPerDayPreference" INTEGER,
    "liquidCaloriesTolerance" TEXT,
    "morningSweetOrSavory" TEXT,
    "planMode" TEXT,
    "motivation" TEXT,
    "mainDifficulty" TEXT,
    "previousDietExperience" TEXT,
    "typicalReasonForSkippingMeals" TEXT,
    "wantsReminders" BOOLEAN,
    "reminderStyle" TEXT,
    "preferredTone" TEXT,
    "hardEatingDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "socialMealFrequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LifestylePreferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" TEXT,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "draftData" JSONB NOT NULL DEFAULT '{}',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiPersonalizationConsent" BOOLEAN NOT NULL DEFAULT false,
    "aiConsentAt" TIMESTAMP(3),
    "aiConsentVersion" TEXT,
    "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT false,
    "dataProcessingConsentAt" TIMESTAMP(3),
    "revokedAiConsentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoutineOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "changedFields" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "temporary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoutineOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoutineAnalysisCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileVersion" INTEGER NOT NULL,
    "routineHash" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoutineAnalysisCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoutineProfile_userId_key" ON "RoutineProfile"("userId");
CREATE UNIQUE INDEX "WorkRoutine_userId_key" ON "WorkRoutine"("userId");
CREATE UNIQUE INDEX "MealSchedule_userId_key" ON "MealSchedule"("userId");
CREATE INDEX "TrainingBlock_userId_position_idx" ON "TrainingBlock"("userId", "position");
CREATE UNIQUE INDEX "AppetiteProfile_userId_key" ON "AppetiteProfile"("userId");
CREATE UNIQUE INDEX "FoodToleranceProfile_userId_key" ON "FoodToleranceProfile"("userId");
CREATE UNIQUE INDEX "LifestylePreferences_userId_key" ON "LifestylePreferences"("userId");
CREATE UNIQUE INDEX "OnboardingProgress_userId_key" ON "OnboardingProgress"("userId");
CREATE UNIQUE INDEX "UserConsent_userId_key" ON "UserConsent"("userId");
CREATE INDEX "RoutineOverride_userId_dateFrom_dateTo_idx" ON "RoutineOverride"("userId", "dateFrom", "dateTo");
CREATE UNIQUE INDEX "RoutineAnalysisCache_userId_routineHash_engineVersion_promptVersion_modelVersion_key" ON "RoutineAnalysisCache"("userId", "routineHash", "engineVersion", "promptVersion", "modelVersion");
CREATE INDEX "RoutineAnalysisCache_userId_createdAt_idx" ON "RoutineAnalysisCache"("userId", "createdAt");

ALTER TABLE "RoutineProfile" ADD CONSTRAINT "RoutineProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkRoutine" ADD CONSTRAINT "WorkRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealSchedule" ADD CONSTRAINT "MealSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingBlock" ADD CONSTRAINT "TrainingBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppetiteProfile" ADD CONSTRAINT "AppetiteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodToleranceProfile" ADD CONSTRAINT "FoodToleranceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LifestylePreferences" ADD CONSTRAINT "LifestylePreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutineOverride" ADD CONSTRAINT "RoutineOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutineAnalysisCache" ADD CONSTRAINT "RoutineAnalysisCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
