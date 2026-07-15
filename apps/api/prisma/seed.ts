import { existsSync } from "node:fs";
import { join } from "node:path";
import dotenv from "dotenv";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateOnboardingNutrition } from "@rotina/domain";

const envPath = [join(process.cwd(), ".env"), join(process.cwd(), "apps/api/.env")].find((path) => existsSync(path));
dotenv.config(envPath ? { path: envPath, override: true } : { override: true });

const prisma = new PrismaClient();

const meals = [
  {
    name: "Bowl cremoso de frango, arroz e legumes",
    mealTime: "lunch",
    caloriesEstimate: 620,
    proteinEstimate: 42,
    budget: "medium",
    isSafeMeal: true,
    ingredients: ["frango desfiado", "arroz branco", "courgette", "cenoura", "iogurte natural", "azeite", "sal suave"],
    recipeSteps: [
      "Aquecer o arroz e os legumes ate ficarem macios.",
      "Juntar o frango desfiado e envolver com iogurte natural.",
      "Finalizar com um fio de azeite para textura mais cremosa."
    ],
    dna: {
      texture: "creamy",
      temperature: "hot",
      volume: "medium",
      cookingTime: "standard",
      dominantFlavors: ["suave", "salgado"],
      proteinSources: ["frango"],
      tags: ["arroz", "legumes"]
    }
  },
  {
    name: "Iogurte proteico com aveia e frutos vermelhos",
    mealTime: "breakfast",
    caloriesEstimate: 430,
    proteinEstimate: 31,
    budget: "low",
    isSafeMeal: true,
    ingredients: ["iogurte grego", "whey baunilha", "aveia fina", "frutos vermelhos", "mel"],
    recipeSteps: [
      "Misturar o iogurte com whey ate ficar sem grumos.",
      "Adicionar aveia fina e frutos vermelhos.",
      "Deixar 5 minutos no frio se quiseres textura mais macia."
    ],
    dna: {
      texture: "creamy",
      temperature: "cold",
      volume: "low",
      cookingTime: "quick",
      dominantFlavors: ["doce", "fresco"],
      proteinSources: ["iogurte"],
      tags: ["aveia", "frutos-vermelhos"]
    }
  },
  {
    name: "Wrap quente de peru e queijo fresco",
    mealTime: "snack",
    caloriesEstimate: 360,
    proteinEstimate: 28,
    budget: "medium",
    ingredients: ["wrap de trigo", "peru fatiado", "queijo fresco", "alface macia", "molho de iogurte"],
    recipeSteps: [
      "Aquecer ligeiramente o wrap para ficar maleavel.",
      "Adicionar peru, queijo fresco e molho de iogurte.",
      "Fechar e tostar pouco tempo para manter textura suave."
    ],
    dna: {
      texture: "soft",
      temperature: "hot",
      volume: "low",
      cookingTime: "quick",
      dominantFlavors: ["suave", "salgado"],
      proteinSources: ["peru", "queijo-fresco"],
      tags: ["wrap"]
    }
  },
  {
    name: "Sopa cremosa com ovos e tostas",
    mealTime: "dinner",
    caloriesEstimate: 520,
    proteinEstimate: 34,
    budget: "low",
    ingredients: ["sopa cremosa de legumes", "ovos", "tostas finas", "azeite", "sal suave"],
    recipeSteps: [
      "Aquecer a sopa ate ficar cremosa.",
      "Adicionar ovos cozidos em pedaços pequenos.",
      "Servir com tostas finas ao lado para controlar textura."
    ],
    dna: {
      texture: "liquid",
      temperature: "hot",
      volume: "medium",
      cookingTime: "standard",
      dominantFlavors: ["suave", "aconchegante"],
      proteinSources: ["ovos"],
      tags: ["sopa", "tostas"]
    }
  }
] satisfies Prisma.MealOptionUncheckedCreateInput[];

async function main() {
  for (const meal of meals) {
    await prisma.mealOption.upsert({
      where: { id: meal.name.toLowerCase().replaceAll(" ", "-") },
      update: meal,
      create: {
        id: meal.name.toLowerCase().replaceAll(" ", "-"),
        ...meal
      }
    });
  }

  const demoNutrition = calculateOnboardingNutrition({
    sex: "male",
    age: 21,
    heightCentimeters: 171,
    weightKilograms: 64,
    bodyGoal: "lean_gain",
    eatingMode: "easy_bulking",
    trainingDaysPerWeek: 6,
    mealTimes: ["breakfast", "lunch", "snack", "dinner"]
  });
  const passwordHash = await bcrypt.hash("rotina-demo-2026", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@rotina.local" },
    update: {
      name: "Demo Hardgainer"
    },
    create: {
      email: "demo@rotina.local",
      passwordHash,
      name: "Demo Hardgainer"
    }
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      preferredTextures: { creamy: 0.95, soft: 0.85, liquid: 0.8, dry: 0.15, crunchy: 0.4 },
      preferredVolumes: { low: 0.95, medium: 0.55, high: 0.12 },
      preferredFlavors: { doce: 0.9, fresco: 0.75, suave: 0.8 },
      avoidedIngredients: ["seco"],
      wakeTime: "07:30",
      sleepTime: "23:30",
      workType: "mixed",
      hardEatingDays: ["monday", "thursday"],
      targetWeightKilograms: 70,
      desiredPace: "normal",
      appetiteMorning: "low",
      appetiteNight: "medium",
      bestAppetiteTime: "18:00",
      worstAppetiteTime: "08:00",
      volumeTolerance: "low",
      avoidedTextures: ["dry"],
      preferredTextureStyle: "mixed",
      nauseaFoods: ["frango seco", "arroz seco"],
      safeFoods: ["iogurte", "wrap", "smoothie"],
      favoriteFoods: ["aveia", "frutos vermelhos", "wraps"],
      dislikedFoods: ["comida seca"],
      allergies: [],
      dietType: "omnivore",
      planMode: "easy_bulking",
      budgetPreference: "medium",
      cookingTimePreference: "quick",
      safeMealIds: ["iogurte-proteico-com-aveia-e-frutos-vermelhos"],
      favoriteMealIds: ["iogurte-proteico-com-aveia-e-frutos-vermelhos"],
      eatingMode: "easy_bulking",
      bodyGoal: "lean_gain",
      dailyWaterTargetMl: demoNutrition.dailyWaterTargetMl
    },
    create: {
      userId: user.id,
      preferredTextures: { creamy: 0.95, soft: 0.85, liquid: 0.8, dry: 0.15, crunchy: 0.4 },
      preferredVolumes: { low: 0.95, medium: 0.55, high: 0.12 },
      preferredFlavors: { doce: 0.9, fresco: 0.75, suave: 0.8 },
      avoidedIngredients: ["seco"],
      wakeTime: "07:30",
      sleepTime: "23:30",
      workType: "mixed",
      hardEatingDays: ["monday", "thursday"],
      targetWeightKilograms: 70,
      desiredPace: "normal",
      appetiteMorning: "low",
      appetiteNight: "medium",
      bestAppetiteTime: "18:00",
      worstAppetiteTime: "08:00",
      volumeTolerance: "low",
      avoidedTextures: ["dry"],
      preferredTextureStyle: "mixed",
      nauseaFoods: ["frango seco", "arroz seco"],
      safeFoods: ["iogurte", "wrap", "smoothie"],
      favoriteFoods: ["aveia", "frutos vermelhos", "wraps"],
      dislikedFoods: ["comida seca"],
      allergies: [],
      dietType: "omnivore",
      planMode: "easy_bulking",
      budgetPreference: "medium",
      cookingTimePreference: "quick",
      safeMealIds: ["iogurte-proteico-com-aveia-e-frutos-vermelhos"],
      favoriteMealIds: ["iogurte-proteico-com-aveia-e-frutos-vermelhos"],
      eatingMode: "easy_bulking",
      bodyGoal: "lean_gain",
      dailyWaterTargetMl: demoNutrition.dailyWaterTargetMl
    }
  });

  await prisma.nutritionTarget.upsert({
    where: { userId: user.id },
    update: { bmr: demoNutrition.bmr, tdee: demoNutrition.tdee, ...demoNutrition.targets },
    create: { userId: user.id, bmr: demoNutrition.bmr, tdee: demoNutrition.tdee, ...demoNutrition.targets }
  });

  await prisma.trainingRoutine.upsert({
    where: { userId: user.id },
    update: {
      trainingDaysPerWeek: 6,
      trainingType: "musculacao",
      preferredTimes: ["evening"],
      trainingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      trainingTime: "18:00",
      trainingIntensity: "high",
      restDays: ["sunday"]
    },
    create: {
      userId: user.id,
      trainingDaysPerWeek: 6,
      trainingType: "musculacao",
      preferredTimes: ["evening"],
      trainingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      trainingTime: "18:00",
      trainingIntensity: "high",
      restDays: ["sunday"]
    }
  });

  await prisma.budgetProfile.upsert({
    where: { userId: user.id },
    update: { level: "medium", maxCookingMinutes: 20 },
    create: { userId: user.id, level: "medium", maxCookingMinutes: 20 }
  });

  await prisma.mealSlot.deleteMany({ where: { userId: user.id } });
  for (const [index, slot] of demoNutrition.mealSlots.entries()) {
    await prisma.mealSlot.create({
      data: {
        userId: user.id,
        mealTime: slot.mealTime,
        targetCalories: slot.targetCalories,
        targetProtein: slot.targetProtein,
        position: index + 1
      }
    });
  }

  await prisma.weightLog.create({
    data: {
      userId: user.id,
      weightKilograms: 64,
      occurredAt: new Date()
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
