CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "quantity" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiMealSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealTime" "MealTime",
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "promptHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMealSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PantryItem_userId_name_key" ON "PantryItem"("userId", "name");
CREATE INDEX "PantryItem_userId_available_idx" ON "PantryItem"("userId", "available");
CREATE INDEX "AiMealSuggestion_userId_createdAt_idx" ON "AiMealSuggestion"("userId", "createdAt");

ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiMealSuggestion" ADD CONSTRAINT "AiMealSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
