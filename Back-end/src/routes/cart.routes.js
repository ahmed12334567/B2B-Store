const express = require("express");
const router = express.Router();
const { addToCart, deleteFromCart, getCart } = require("../controllers/cart.controller");
const { verifyUser } = require("../middleware/auth.middleware");

router.post("/add-to-cart", verifyUser, addToCart);
router.delete("/delete-product-cart", verifyUser, deleteFromCart);
router.get("/get-cart", verifyUser, getCart);

module.exports = router;