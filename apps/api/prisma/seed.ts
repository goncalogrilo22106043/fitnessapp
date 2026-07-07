import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateOnboardingNutrition } from "@rotina/domain";

const prisma = new PrismaClient();

const meals = [
  {
    name: "Bowl cremoso de frango, arroz e legumes",
    mealTime: "lunch",
    caloriesEstimate: 620,
    proteinEstimate: 42,
    budget: "medium",
    isSafeMeal: true,
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
];

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
    update: { trainingDaysPerWeek: 6, trainingType: "musculacao", preferredTimes: ["evening"] },
    create: { userId: user.id, trainingDaysPerWeek: 6, trainingType: "musculacao", preferredTimes: ["evening"] }
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
