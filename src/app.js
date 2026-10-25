
const express = require("express");
const cors = require("cors");
const aiRoutes = require("./modules/ai/ai.routes");
const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/user.routes");
const mealPlanRoutes = require("./modules/meal-plans/meal-plans.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Diet Planner API is running",
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend is healthy",
        timestamp: new Date().toISOString(),
    });
});
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/meal-plans", mealPlanRoutes);
module.exports = app;
