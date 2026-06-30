const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const {createProduct} = require("../middleware/admin.middleware")
router.use("/", dashboardController);
router.post("/createProduct", createProduct, dashboardController)
router.post("/import-file-products", dashboardController)
router.delete("/delete-order", createProduct, dashboardController)
router.delete("/delete-product", createProduct, dashboardController)
router.delete("/delete-user", createProduct, dashboardController)
router.get("/all-orders", dashboardController)
module.exports = router;
