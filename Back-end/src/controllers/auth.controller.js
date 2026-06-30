const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const user = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
    try {
        const username = req.body?.name;
        const email = req.body?.email?.trim();
        const password = req.body?.password?.trim();
        const location = req.body?.location?.trim();
        const phone = req.body?.phone;
        const isGoogleUser = req.body?.isGoogleUser;
        const googleToken = req.body?.googleIdToken;

        if (!isGoogleUser && !password) {
            return res.status(400).json({ success: false, field: "password", message: "Password is required" });
        }

        user.findByEmail([email], async (err, result) => {
            if (err) {
                console.error("DB Error: ", err);
                return res.status(500).json({ success: false, message: "Internal server error" });
            }

            if (result && result.length > 0) {
                const existingUser = result[0];

                if (existingUser.isGoogleUser === 1 && isGoogleUser) {
                    if (!googleToken) {
                        return res.status(400).json({ success: false, message: "Google token is required" });
                    }

                    const token = jwt.sign(
                        { id: existingUser.user_id, email: existingUser.email },
                        JWT_SECRET,
                        { expiresIn: "7d" }
                    );

                    return res.status(200).json({
                        success: true,
                        message: "Logged in successfully via Google",
                        user: {
                            name: existingUser.name,
                            email: existingUser.email,
                            location: existingUser.address,
                            phone: existingUser.phone
                        },
                        token: token
                    });
                }

                return res.status(400).json({ success: false, field: "email", message: "Email already exists" });
            }

            try {
                let finalPassword = null;

                if (!isGoogleUser) {
                    finalPassword = await bcrypt.hash(password, 10);
                }

                const userData = {
                    username: username,
                    email: email,
                    password: finalPassword,
                    address: location,
                    phone: phone,
                    isGoogleUser: isGoogleUser,
                    role: "customer"
                };


                user.createUser(userData, (createErr) => {
                    if (createErr) {
                        console.error("DB Error on Create: ", createErr);
                        return res.status(500).json({ success: false, message: "Internal server error" });
                    }

                    const token = jwt.sign(
                        { id: result.insertId, email: userData.email },
                        JWT_SECRET,
                        { expiresIn: "7d" }
                    );

                    return res.status(201).json({
                        success: true,
                        message: "User registered successfully",
                        user: { name: userData.username, email: userData.email },
                        token: token
                    });
                });

            } catch (bcryptError) {
                console.error("Bcrypt Error: ", bcryptError);
                return res.status(500).json({ success: false, message: "Error processing password" });
            }
        });

    } catch (error) {
        console.error("Server Error: ", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const email = req.body?.email?.trim();
        const password = req.body?.password?.trim();
        const isGoogleUser = req.body?.isGoogleUser;
        const googleToken = req.body?.googleIdToken;
        
        if (!email || (!isGoogleUser && !password)) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }

        user.findByEmail(email, async (error, result) => {
            if (error) {
                console.error("DB Error: ", error);
                return res.status(500).json({ success: false, message: "Internal server error" });
            }

            const existingUser = result && result[0];
            if (!existingUser) {
                return res.status(400).json({ success: false, field: "email", message: "Wrong email or password" });
            }

            if (isGoogleUser) {
                if (!googleToken) {
                    return res.status(400).json({ success: false, message: "Google token is required" });
                }

                if (existingUser.isGoogleUser !== 1) {
                    return res.status(400).json({ success: false, message: "هذا الحساب غير مسجل عبر جوجل، يرجى الدخول بكلمة المرور" });
                }

                const token = jwt.sign(
                    { id: existingUser.user_id, email: existingUser.email },
                    JWT_SECRET,
                    { expiresIn: "7d" }
                );

                return res.status(200).json({
                    success: true,
                    message: "Logged in successfully via Google",
                    user: { name: existingUser.name, email: existingUser.email },
                    token: token
                });
            }

            if (existingUser.isGoogleUser === 1 || !existingUser.password_user) {
                return res.status(400).json({
                    success: false,
                    field: "password",
                    message: "هذا الحساب مسجل عبر جوجل. يرجى استخدام زر تسجيل الدخول بواسطة جوجل."
                });
            }

            const isMatch = await bcrypt.compare(password, existingUser.password_user);
            if (!isMatch) {
                return res.status(400).json({ success: false, field: "password", message: "Wrong email or password" });
            }

            const token = jwt.sign(
                { id: existingUser.user_id, email: existingUser.email },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.status(200).json({
                success: true,
                message: "Logged in successfully",
                user: { name: existingUser.name, email: existingUser.email },
                token: token
            });
        });

    } catch (err) {
        console.error("Server error: ", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.post("/google-data", async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: "Token is required" });
    }

    if (token === "test_token") {
        return res.status(200).json({
            success: true,
            token: token,
            message: "Logged in successfully via Google",
            user: {
                name: "Ahmed Tester",
                email: "ahmed_test_postman@gmail.com"
            }
        });
    }


    try {
        const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);

        if (!googleResponse.ok) {
            return res.status(401).json({ success: false, message: "Invalid Google Token" });
        }

        const userData = await googleResponse.json();

        return res.status(200).json({
            success: true,
            token: token,
            message: "Logged in successfully via Google",
            user: {
                name: userData.name,
                email: userData.email
            }
        });

    } catch (error) {
        console.error("Google API Error:", error);
        return res.status(500).json({ success: false, message: "Failed to connect to Google servers" });
    }
});

router.get("/user", (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log(token);
    
    if (!token) {
        res.status(400).json({ success: false, message: "token is required" })
        return;
    }

    else {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("JWT Verification Error:", err.message);
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ success: false, message: "Token expired" });
                }
                return res.status(403).json({ success: false, message: "Invalid token" });
            }
            user.findByEmail(decoded.email, async (err, result) => {
                if (err) {
                    console.error("DB Error: ", err);
                    return res.status(500).json({ success: false, message: "Internal server error" });
                }
                const foundUser = result && result[0];
                if (!foundUser) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }
                return res.status(200).json({ success: true, user: { name: foundUser.name } })
            })
        });
    }
})

router.post("/login/admin", (req, res) => {
    try {
        const email = req.body?.email?.trim()
        const password = req.body?.password?.trim()
        user.findByEmail(email, async (error, result) => {
            if (error) {
                console.log("DB Error: ", error);
                return res.status(500).json({ success: false, data: { message: "server error" } })
            }
            let user = result[0]
            if (!user) {
                return res.status(400).json({ success: false, data: { message: "User not found" } })
            }
            let comparePassword = await bcrypt.compare(password, user.password_user)
            if (!comparePassword) {
                return res.status(400).json({ success: false, data: { message: "Wrong Email or Password" } })
            }
            if (user.role !== "admin") {
                return res.status(400).json({ success: false, data: { message: "Wrong  or Password" } })
            }
            else {
                const token = jwt.sign(
                    { id: user.user_id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: "1h" }
                );
                return res.status(200).json({
                    success: true, data: {
                        message: "login successfuly admin",
                        user: {
                            email: user.email,
                            role: user.role
                        },
                        token: token
                    }
                })
            }
        })
    } catch (error) {
        console.log("error: ", error);
        return res.status(500).json({ success: false, data: { message: "server error" } })
    }
})

module.exports = router;