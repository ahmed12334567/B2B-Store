const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware: verify admin token
function verifyAdmin(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Token is required" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid or expired token" });
        }
        req.adminEmail = decoded.email;
        req.adminId = decoded.id;
        next();
    });
}

// GET /api/dashboard/stats — Overview statistics
router.get("/stats", verifyAdmin, (req, res) => {
    const queries = {
        totalUsers: "SELECT COUNT(*) as count FROM users",
        totalProducts: "SELECT COUNT(*) as count FROM products",
        totalOrders: "SELECT COUNT(*) as count FROM orders",
        recentUsers: `SELECT user_id, name, email, created_at FROM users ORDER BY user_id DESC LIMIT 5`,
        recentProducts: `SELECT product_id, name, price, image_url FROM products ORDER BY product_id DESC LIMIT 5`
    };

    const stats = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;

    function tryComplete() {
        completed++;
        if (completed === totalQueries) {
            return res.status(200).json({ success: true, data: stats });
        }
    }

    // Total users
    pool.query(queries.totalUsers, (err, result) => {
        stats.totalUsers = err ? 0 : result[0].count;
        tryComplete();
    });

    // Total products
    pool.query(queries.totalProducts, (err, result) => {
        stats.totalProducts = err ? 0 : result[0].count;
        tryComplete();
    });

    // Total orders
    pool.query(queries.totalOrders, (err, result) => {
        stats.totalOrders = err ? 0 : result[0].count;
        tryComplete();
    });

    // Recent users
    pool.query(queries.recentUsers, (err, result) => {
        stats.recentUsers = err ? [] : result;
        tryComplete();
    });

    // Recent products
    pool.query(queries.recentProducts, (err, result) => {
        stats.recentProducts = err ? [] : result;
        tryComplete();
    });
});

// GET /api/dashboard/users — All users list
router.get("/users", verifyAdmin, (req, res) => {
    pool.query("SELECT user_id, name, email, phone, address, role, isGoogleUser FROM users ORDER BY user_id DESC", (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        return res.status(200).json({ success: true, data: result });
    });
});

// GET /api/dashboard/products — All products list
router.get("/products", verifyAdmin, (req, res) => {
    pool.query("SELECT * FROM products ORDER BY product_id DESC", (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        return res.status(200).json({ success: true, data: result });
    });
});

module.exports = router;
