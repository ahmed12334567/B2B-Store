const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const productModel = require("../models/product.model");
const orderModel = require("../models/order.model")
const userModel = require("../models/user.model")
require("dotenv").config();
const {verifyAdmin} = require("../middleware/admin.middleware")
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cloudinary = require("cloudinary").v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



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

    pool.query(queries.totalUsers, (err, result) => {
        stats.totalUsers = err ? 0 : result[0].count;
        tryComplete();
    });

    pool.query(queries.totalProducts, (err, result) => {
        stats.totalProducts = err ? 0 : result[0].count;
        tryComplete();
    });

    pool.query(queries.totalOrders, (err, result) => {
        stats.totalOrders = err ? 0 : result[0].count;
        tryComplete();
    });

    pool.query(queries.recentUsers, (err, result) => {
        stats.recentUsers = err ? [] : result;
        tryComplete();
    });

    pool.query(queries.recentProducts, (err, result) => {
        stats.recentProducts = err ? [] : result;
        tryComplete();
    });
});

router.get("/users", verifyAdmin, (req, res) => {
    userModel.getAllUsers((error, result) =>{
        if(error){
            console.log("DB Error: ", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (result && result.length > 0) {
            return res.status(200).json({ success: true, data: result });
        } else {
            return res.status(404).json({ success: false, message: "No Users found in database" });
        }
    })
});

router.get("/products", verifyAdmin, (req, res) => {
    productModel.getAllProduct((err, result) => { 
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (result && result.length > 0) {
            return res.status(200).json({ success: true, data: result });
        } else {
            return res.status(404).json({ success: false, message: "No products found in database" });
        }
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
        const category = req.body?.category?.trim();
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: "يرجى رفع صورة المنتج" });
        }
        const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const uploadResult = await cloudinary.uploader.upload(fileBase64, {
            folder: 'products'
        });
        
        const imageUrl = uploadResult.secure_url;
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
        productModel.createProduct(newProduct, (error, result) => {
            if (error) {
                console.error("DB Error: ", error);
                return res.status(500).json({ success: false, message: "حدث خطأ في قاعدة البيانات" });
            }
            if (result) {
                return res.status(201).json({ 
                    success: true, 
                    message: "Added product is successfuly", 
                    product: newProduct 
                });
            } else {
                return res.status(400).json({ success: false, message: "product not added" });
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
