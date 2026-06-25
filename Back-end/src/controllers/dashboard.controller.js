const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const productModel = require("../models/product.model");
const orderModel = require("../models/order.model")
require("dotenv").config();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cloudinary = require("cloudinary").v2
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware: verify admin token
function verifyAdmin(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Token is required" });
    }
    // if(token === "test_token"){
    //     next()
    // }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
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
        recentUsers: `SELECT user_id, name, email FROM users WHERE role = "customer" ORDER BY user_id DESC LIMIT 5 `,
        recentProducts: `SELECT product_id, product_name,Stock_Quantity,description, price, imgURL FROM products ORDER BY product_id DESC LIMIT 5`
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
router.get("/last-products",verifyAdmin, (req, res) => {
    productModel.getLastProduct((error, result) => {
        if (error) {
            console.log("Error Fetching product: ", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        
        if (result && result.length > 0) {
            return res.status(200).json({ success: true, data: result });
        } else {
            return res.status(404).json({ success: false, message: "No products found in database" });
        }
    });
});
router.post("/createProduct", verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const productName = req.body?.productName?.trim();
        const price = req.body?.price;
        const description = req.body?.description?.trim();
        const quantity = req.body?.quantity;
        const category = req.body?.category?.trim(); // أضفنا ? لحمايتها من الانهيار إذا كانت فارغة
        const file = req.file;

        // التحقق من وجود الصورة
        if (!file) {
            return res.status(400).json({ success: false, message: "يرجى رفع صورة المنتج" });
        }

        // تحويل الصورة إلى Base64 لرفعها إلى Cloudinary
        const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        
        const uploadResult = await cloudinary.uploader.upload(fileBase64, {
            folder: 'products'
        });
        
        const imageUrl = uploadResult.secure_url;

        // تحديد رقم القسم
        let categoryID = 3;
        if (category === "الكترونيات") {
            categoryID = 1;
        } else if (category === "ملابس") {
            categoryID = 2;
        }

        const newProduct = {
            name: productName,
            Quantity: quantity,
            description: description,
            price: price,
            category_id: categoryID,
            imgURL: imageUrl
        };

        // إدخال المنتج في قاعدة البيانات
        productModel.createProduct(newProduct, (error, result) => {
            if (error) {
                console.error("DB Error: ", error);
                return res.status(500).json({ success: false, message: "حدث خطأ في قاعدة البيانات" });
            }

            // تم تعديل الشرط ليناسب عمليات الـ INSERT (التأكد من نجاح العملية)
            if (result) {
                return res.status(201).json({ 
                    success: true, 
                    message: "تم إنشاء المنتج بنجاح", 
                    product: newProduct 
                });
            } else {
                return res.status(400).json({ success: false, message: "لم يتم حفظ المنتج" });
            }
        });

    } catch (err) {
        console.error("Cloudinary or Server Error: ", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.get("/all-orders", verifyAdmin, (req, res) =>{
    orderModel.getAllOrders((error, result) => {
        if(error){
            console.log("DB Error: ", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        if(result){
            return res.status(200).json({success: true, data:{message: "All orders returned successfuly",
                orders: result
            }})
        }
    })
})
module.exports = router;
