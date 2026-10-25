
const express = require("express");
const prisma = require("../../config/database");
const authMiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

// GET: Retrieve the logged-in user's profile
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                dietaryProfile: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Get profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile",
        });
    }
});

// PUT: Update the logged-in user's dietary preferences
router.put("/me/preferences", authMiddleware, async (req, res) => {
    try {
        const {
            dietType,
            fitnessGoal,
            dailyCalories,
            allergies,
            foodPreferences,
        } = req.body;

        const allowedDietTypes = [
            "no_preference",
            "vegetarian",
            "vegan",
            "keto",
            "gluten_free",
            "non_vegetarian",
        ];

        const allowedFitnessGoals = [
            "weight_loss",
            "muscle_gain",
            "maintenance",
        ];

        // Validate diet type
        if (
            dietType !== undefined &&
            (typeof dietType !== "string" ||
                !allowedDietTypes.includes(dietType))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid diet type",
            });
        }

        // Validate fitness goal
        if (
            fitnessGoal !== undefined &&
            (typeof fitnessGoal !== "string" ||
                !allowedFitnessGoals.includes(fitnessGoal))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid fitness goal",
            });
        }

        // Validate daily calorie target
        if (
            dailyCalories !== undefined &&
            dailyCalories !== null &&
            (!Number.isInteger(dailyCalories) ||
                dailyCalories < 500 ||
                dailyCalories > 10000)
        ) {
            return res.status(400).json({
                success: false,
                message: "Daily calories must be an integer between 500 and 10000",
            });
        }

        // Validate allergies and food preferences
        if (
            allergies !== undefined &&
            (!Array.isArray(allergies) ||
                !allergies.every((item) => typeof item === "string"))
        ) {
            return res.status(400).json({
                success: false,
                message: "Allergies must be an array of strings",
            });
        }

        if (
            foodPreferences !== undefined &&
            (!Array.isArray(foodPreferences) ||
                !foodPreferences.every((item) => typeof item === "string"))
        ) {
            return res.status(400).json({
                success: false,
                message: "Food preferences must be an array of strings",
            });
        }

        // Build the update data using only allowed fields
        const updateData = {};

        if (dietType !== undefined) {
            updateData.dietType = dietType;
        }

        if (fitnessGoal !== undefined) {
            updateData.fitnessGoal = fitnessGoal;
        }

        if (dailyCalories !== undefined) {
            updateData.dailyCalories = dailyCalories;
        }

        if (allergies !== undefined) {
            updateData.allergies = allergies;
        }

        if (foodPreferences !== undefined) {
            updateData.foodPreferences = foodPreferences;
        }

        // Create a profile if it does not exist; otherwise update it
        const profile = await prisma.dietaryProfile.upsert({
            where: {
                userId: req.userId,
            },
            create: {
                userId: req.userId,
                ...updateData,
            },
            update: updateData,
        });

        return res.status(200).json({
            success: true,
            message: "Dietary preferences updated successfully",
            data: profile,
        });
    } catch (error) {
        console.error("Update preferences error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to update dietary preferences",
        });
    }
});

module.exports = router;
