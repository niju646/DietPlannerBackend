
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required",
            });
        }

        const token = authHeader.split(" ")[1];

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error("JWT_SECRET is missing from .env");
            return res.status(500).json({
                success: false,
                message: "Server configuration error",
            });
        }

        const decoded = jwt.verify(token, secret);

        req.userId = decoded.userId;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}

module.exports = authMiddleware;
