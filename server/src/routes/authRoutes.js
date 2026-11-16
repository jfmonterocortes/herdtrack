const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Register a new user and farm
router.post("/register", async (req, res) => {
    try {
        const { email, password, farmName } = req.body;

        // Make sure required fields are provided
        // Check that all required fields are strings
        if (typeof email !== "string" || typeof password !== "string" || typeof farmName !== "string") {
            return res.status(400).json({
                error: "Email, password and farm name are required."
            });
        }

        // Remove unnecessary spaces from email and farm name
        const cleanEmail = email.trim().toLowerCase();
        const cleanFarmName = farmName.trim();

        // Check email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                error: "Invalid email address."
            });
        }

        // Require a password with at least 8 characters
        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters."
            });
        }

        // Make sure farm name is not just spaces
        if (!cleanFarmName) {
            return res.status(400).json({
                error: "Farm name cannot be empty."
            });
        }

        // Check whether the email is already registered
        const existingUser = await prisma.user.findUnique({
            where: { email: cleanEmail }
        });

        if (existingUser) {
            return res.status(409).json({
                error: "Email is already registered."
            });
        }

        // Hash password before saving it
        const passwordHash = await bcrypt.hash(password, 12);

        // Create the farm and its first user together
        const farm = await prisma.farm.create({
            data: {
                name: cleanFarmName,
                users: {
                    create: {
                        email: cleanEmail,
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
            error: "Something went wrong during registration."
        });
    }
});



// Log in an existing user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields and types
        if ( typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
            return res.status(400).json({
                error: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email: cleanEmail }
        });

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        // Compare submitted password with stored hash
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password."
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
            error: "Something went wrong during login."
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
                error: "User not found or session invalid."
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
            error: "Something went wrong while retrieving user."
        });
    }
});


// Update the logged-in user's profile
router.put("/me", authMiddleware, async (req, res) => {
    try {
        const { name, farmName, weightUnit } = req.body;

        // Check the preferred weight unit
        if (weightUnit !== undefined && !["KG", "LB"].includes(weightUnit)) {
            return res.status(400).json({
                error: "Weight unit must be KG or LB."
            });
        }

        // Build the fields to update
        const userData = {};

        if (name !== undefined) {
            if (typeof name !== "string") {
                return res.status(400).json({
                    error: "Name must be text."
                });
            }
            userData.name = name.trim();
        }

        if (weightUnit !== undefined) {
            userData.weightUnit = weightUnit;
        }

        if (farmName !== undefined &&
            (typeof farmName !== "string" || !farmName.trim())) {
            return res.status(400).json({
                error: "Farm name must be non-empty text."
            });
        }

        // Update the user and farm together
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...userData,
                ...(farmName !== undefined && {
                    farm: {
                        update: { name: farmName.trim() }
                    }
                })
            },
            include: { farm: true }
        });

        return res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            weightUnit: user.weightUnit,
            farmId: user.farmId,
            farmName: user.farm.name
        });

    } catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({
            error: "Failed to update profile."
        });
    }
});



module.exports = router;
