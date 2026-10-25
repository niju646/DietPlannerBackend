
const express = require("express");
const prisma = require("../../config/database");
const authMiddleware = require("../../middleware/auth.middleware");
const {
    generateMealSuggestion,
} = require("./gemini.services");

const router = express.Router();

router.post(
    "/meal-suggestion",
    authMiddleware,
    async (req, res) => {
        try {
            const { ingredients } = req.body;

            if (
                ingredients !== undefined &&
                (typeof ingredients !== "string" ||
                    ingredients.length > 2000)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Ingredients must be text up to 2000 characters",
                });
            }

            // Get the logged-in user's saved dietary profile
            const profile = await prisma.dietaryProfile.findUnique({
                where: {
                    userId: req.userId,
                },
            });

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: "Dietary profile not found. Set up your preferences first.",
                });
            }

            // Generate a meal using the saved profile
            const meal = await generateMealSuggestion(
                profile,
                ingredients
            );

            return res.status(200).json({
                success: true,
                data: {
                    meal: meal,
                },
            });
        } catch (error) {
            console.error("Meal suggestion error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Failed to generate meal suggestion",
            });
        }
    }
);

module.exports = router;
