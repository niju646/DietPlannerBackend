
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/database");

const router = express.Router();

// Generate JWT token
function generateToken(userId) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is missing in .env");
    }

    return jwt.sign(
        { userId: userId },
        secret,
        { expiresIn: "7d" }
    );
}

// POST: Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, and password of at least 8 characters are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check whether the email already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user and default dietary profile
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash: passwordHash,
                dietaryProfile: {
                    create: {},
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        // Generate authentication token
        const token = generateToken(user.id);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                user: user,
                token: token,
            },
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to register user",
        });
    }
});

// POST: Login an existing user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user
        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        // Verify password
        if (
            !user ||
            !(await bcrypt.compare(password, user.passwordHash))
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate authentication token
        const token = generateToken(user.id);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
                token: token,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to log in",
        });
    }
});

module.exports = router;
