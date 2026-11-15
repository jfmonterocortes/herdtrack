const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register a new user and farm
router.post("/register", async (req, res) => {
    try {
        const { email, password, farmName } = req.body;

        // Make sure required fields are provided
        if (!email || !password || !farmName) {
            return res.status(400).json({
                message: "Email, password and farm name are required."
            });
        }

        // Check whether the email is already registered
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered."
            });
        }

        // Hash password before saving it
        const passwordHash = await bcrypt.hash(password, 12);

        // Create the farm and its first user together
        const farm = await prisma.farm.create({
            data: {
                name: farmName,
                users: {
                    create: {
                        email,
                        passwordHash
                    }
                }
            },
            include: {
                users: true
            }
        });

        const user = farm.users[0];

        // Generate the login token
        const token = jwt.sign(
            {
                userId: user.id,
                farmId: farm.id
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(201).json({
            message: "Registration successful.",
            token,
            user: {
                id: user.id,
                email: user.email,
                farmId: farm.id
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Something went wrong during registration."
        });
    }
});



// Log in an existing user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Compare submitted password with stored hash
        const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                farmId: user.farmId
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                email: user.email,
                farmId: user.farmId
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Something went wrong during login."
        });
    }
});


// Get information about the logged-in user
router.get("/me", authMiddleware, async (req, res) => {
    try {
        // Find the user using the ID from their JWT
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                farm: true
            }
        });

        if (!user || user.farmId !== req.user.farmId) {
            return res.status(401).json({
                message: "User not found or session invalid."
            });
        }

        // Return user information without the password hash
        return res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            weightUnit: user.weightUnit,
            farmId: user.farmId,
            farmName: user.farm.name
        });

    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            message: "Something went wrong while retrieving user."
        });
    }
});




module.exports = router;
