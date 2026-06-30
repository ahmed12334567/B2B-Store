const express = require("express");
const router = express.Router();
const productModel = require("../models/product.model");
const orderModel = require("../models/order.model")
const userModel = require("../models/user.model")
const statsModel = require("../models/dashboard.model")
const XLSX = require("xlsx");
const fs = require("fs")
require("dotenv").config();
const { verifyAdmin } = require("../middleware/admin.middleware")
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cloudinary = require("cloudinary").v2

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get("/stats", (req, res) => {
    statsModel.totalUser((error, result) => {
        let finalRsult = {};

        if (error) {
            console.log("DB Error: ", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (result) {
            finalRsult.totalUsers = result[0].count;

            statsModel.totalProducts((error, result) => {
                if (error) {
                    console.log("DB Error: ", error);
                    return res.status(500).json({ success: false, message: "Internal server error" });
                }
                if (result) {
                    finalRsult.totalProducts = result[0].count;

                    statsModel.totalOrders((error, result) => {
                        if (error) {
                            console.log("DB Error: ", error);
                            return res.status(500).json({ success: false, message: "Internal server error" });
                        }
                        if (result) {
                            finalRsult.totalOrders = result[0].count;

                            statsModel.recentUsers((error, result) => {
                                if (error) {
                                    console.log("DB Error: ", error);
                                    return res.status(500).json({ success: false, message: "Internal server error" });
                                }
                                if (result) {
                                    finalRsult.recentUsers = result;
                                    statsModel.recentProducts((error, result) => {
                                        if (error) {
                                            console.log("DB Error: ", error);
                                            return res.status(500).json({ success: false, message: "Internal server error" });
                                        }
                                        if (result) {
                                            finalRsult.recentProducts = result
                                            return res.status(200).json({ success: true, data: finalRsult });
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get("/users", verifyAdmin, (req, res) => {
    userModel.getAllUsers((error, result) => {
        if (error) {
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
router.get("/last-products", verifyAdmin, (req, res) => {
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
const uploadFile = multer({
    dest: "uploads/",
    fileFilter: (req, file, cb) => {
        const allowedExtensions = [".xlsx", ".csv", ".txt"];

        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error("Invalid file type"));
        }

        cb(null, true);
    }
});
router.post("/import-file-products", verifyAdmin, upload.single("file"), async (req, res) => {
    try {
        const file = req.file
        console.log(req.file);
        const workbook = XLSX.read(
            req.file.buffer,
            { type: "buffer" }
        );
        const sheetName = workbook.SheetNames[0];
        const products = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName]
        );
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }
        if (!products.length) {
            return res.status(400).json({
                success: false,
                message: "File is empty"
            });
        }
        if (!workbook.SheetNames.includes("Products")) {
            return res.status(400).json({
                success: false,
                message: "Products sheet not found"
            });
        }
        console.log(products);
        const requriedFalides = ["product_name", "stock_quantity", "description", "price", "category_id", "imgURL"]
        const headers = Object.keys(products[0] || {});
        const missingFields = requriedFalides.filter(
            field => !headers.includes(field)
        );
        if (missingFields.length) {
            return res.status(400).json({
                message: `Missing fields: ${missingFields.join(", ")}`
            });
        }

        const errors = [];
        products.forEach((product, index) => {
            if (!product.product_name) {
                errors.push(`Row ${index + 2}: product_name is required`);
            }

            if (!product.price) {
                errors.push(`Row ${index + 2}: price is required`);
            }

            if (!product.category_id) {
                errors.push(`Row ${index + 2}: category_id is required`);
            }
        });

        if (errors.length) {
            return res.status(400).json({
                success: false,
                errors
            });
        }
        const productsData = products.map(product => ({
            name: product.product_name,
            Quantity: product.stock_quantity,
            description: product.description,
            price: Number(product.price),
            category_id: Number(product.category_id),
            imgURL: product.imgURL
        }));
        console.log(productsData);

        statsModel.createProducts(productsData, (error, result) => {
            if (error) {
                console.error("DB Error: ", error);
                return res.status(500).json({ success: false, message: "حدث خطأ في قاعدة البيانات" });
            }
            if (result) {
                multer({
                    storage: multer.memoryStorage()
                })
                return res.status(201).json({ success: true, data: { inserted: result.affectedRows, products: productsData} })
            }
        })

    } catch (error) {
        console.log("Server Error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
})

router.get("/all-orders", verifyAdmin, (req, res) => {
    orderModel.getAllOrders((error, result) => {
        if (error) {
            console.log("DB Error: ", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        if (result) {
            return res.status(200).json({
                success: true, data: {
                    message: "All orders returned successfuly",
                    orders: result
                }
            })
        }
    })
})

router.delete("/delete-order", verifyAdmin, (req, res) => {
    const order_id = req.body?.order_id
    orderModel.deleteOrder(order_id, (error, result) => {
        if (error) {
            console.log("DB Error: ", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        if (result) {
            return res.status(200).json({ success: true, data: null })
        }
    })
})
module.exports = router;
