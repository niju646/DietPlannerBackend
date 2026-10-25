
const express = require("express");
const prisma = require("../../config/database");
const authMiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

const VALID_MEAL_TYPES = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
];

// POST /api/meal-plans
// Create a weekly plan and save its meals
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { weekStart, meals } = req.body;

        if (!weekStart || !Array.isArray(meals)) {
            return res.status(400).json({
                success: false,
                message: "weekStart and meals array are required",
            });
        }

        const parsedWeekStart = new Date(`${weekStart}T00:00:00.000Z`);

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(weekStart) ||
            Number.isNaN(parsedWeekStart.getTime()) ||
            parsedWeekStart.toISOString().slice(0, 10) !== weekStart
        ) {
            return res.status(400).json({
                success: false,
                message: "weekStart must be a valid date in YYYY-MM-DD format",
            });
        }

        // Limit each request to one week's worth of meals
        if (meals.length > 35) {
            return res.status(400).json({
                success: false,
                message: "A weekly plan can contain at most 35 meals",
            });
        }

        const invalidMeal = meals.find((meal) => {
            if (!meal || typeof meal !== "object" || Array.isArray(meal)) {
                return true;
            }

            if (
                typeof meal.date !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(meal.date)
            ) {
                return true;
            }

            const parsedDate = new Date(`${meal.date}T00:00:00.000Z`);

            if (
                Number.isNaN(parsedDate.getTime()) ||
                parsedDate.toISOString().slice(0, 10) !== meal.date
            ) {
                return true;
            }

            const dayDifference =
                (parsedDate.getTime() - parsedWeekStart.getTime()) /
                (24 * 60 * 60 * 1000);

            return (
                dayDifference < 0 ||
                dayDifference > 6 ||
                typeof meal.mealType !== "string" ||
                !VALID_MEAL_TYPES.includes(meal.mealType) ||
                typeof meal.mealName !== "string" ||
                !meal.mealName.trim() ||
                meal.mealName.length > 200 ||
                !Array.isArray(meal.ingredients) ||
                !meal.ingredients.every((item) => typeof item === "string") ||
                !Array.isArray(meal.instructions) ||
                !meal.instructions.every((item) => typeof item === "string") ||
                (meal.calories != null &&
                    (!Number.isInteger(meal.calories) || meal.calories < 0)) ||
                ["protein", "carbohydrates", "fat"].some(
                    (field) =>
                        meal[field] != null &&
                        (typeof meal[field] !== "number" ||
                            !Number.isFinite(meal[field]) ||
                            meal[field] < 0)
                )
            );
        });

        if (invalidMeal) {
            return res.status(400).json({
                success: false,
                message: "One or more meals contain invalid data",
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Each user has one plan per week
            const plan = await tx.mealPlan.upsert({
                where: {
                    userId_weekStart: {
                        userId: req.userId,
                        weekStart: parsedWeekStart,
                    },
                },
                create: {
                    userId: req.userId,
                    weekStart: parsedWeekStart,
                },
                update: {},
            });

            // Replace existing meals for this week
            await tx.plannedMeal.deleteMany({
                where: {
                    mealPlanId: plan.id,
                },
            });

            if (meals.length > 0) {
                await tx.plannedMeal.createMany({
                    data: meals.map((meal) => ({
                        mealPlanId: plan.id,
                        date: new Date(`${meal.date}T00:00:00.000Z`),
                        mealType: meal.mealType,
                        mealName: meal.mealName.trim(),
                        ingredients: meal.ingredients,
                        instructions: meal.instructions,
                        calories: meal.calories ?? null,
                        protein: meal.protein ?? null,
                        carbohydrates: meal.carbohydrates ?? null,
                        fat: meal.fat ?? null,
                    })),
                });
            }

            return tx.mealPlan.findUnique({
                where: {
                    id: plan.id,
                },
                include: {
                    meals: {
                        orderBy: [
                            { date: "asc" },
                            { mealType: "asc" },
                        ],
                    },
                },
            });
        });

        return res.status(201).json({
            success: true,
            message: "Weekly meal plan saved successfully",
            data: result,
        });
    } catch (error) {
        console.error("Create meal plan error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to save weekly meal plan",
        });
    }
});

// GET /api/meal-plans
// Retrieve all weekly plans belonging to the logged-in user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const plans = await prisma.mealPlan.findMany({
            where: {
                userId: req.userId,
            },
            include: {
                meals: {
                    orderBy: [
                        { date: "asc" },
                        { mealType: "asc" },
                    ],
                },
            },
            orderBy: {
                weekStart: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: plans,
        });
    } catch (error) {
        console.error("Get meal plans error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve meal plans",
        });
    }
});

// GET /api/meal-plans/:id
// Retrieve one weekly plan belonging to the logged-in user
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const planId = Number(req.params.id);

        if (!Number.isSafeInteger(planId) || planId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid meal plan ID",
            });
        }

        const plan = await prisma.mealPlan.findFirst({
            where: {
                id: planId,
                userId: req.userId,
            },
            include: {
                meals: {
                    orderBy: [
                        { date: "asc" },
                        { mealType: "asc" },
                    ],
                },
            },
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Meal plan not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: plan,
        });
    } catch (error) {
        console.error("Get meal plan error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve meal plan",
        });
    }
});

// DELETE /api/meal-plans/:id
// Delete one weekly plan belonging to the logged-in user
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const planId = Number(req.params.id);

        if (!Number.isSafeInteger(planId) || planId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid meal plan ID",
            });
        }

        const result = await prisma.mealPlan.deleteMany({
            where: {
                id: planId,
                userId: req.userId,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                success: false,
                message: "Meal plan not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Meal plan deleted successfully",
        });
    } catch (error) {
        console.error("Delete meal plan error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete meal plan",
        });
    }
});

module.exports = router;
