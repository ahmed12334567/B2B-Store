const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");

router.get("/:id", productController);
router.get("/", productController);

module.exports = router;
