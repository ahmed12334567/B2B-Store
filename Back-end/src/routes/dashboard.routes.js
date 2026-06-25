const express = require("express");
const router = express.Router();
require('dotenv').config();
const dashboardController = require("../controllers/dashboard.controller");
const {createProduct} = require("../middleware/admin.middleware")
router.use("/", dashboardController);
router.post("/createProduct", createProduct, dashboardController)
router.get("/all-orders", dashboardController)
module.exports = router;
