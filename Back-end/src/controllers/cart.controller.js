const cartModel = require("../models/cart.model");

const addToCart = (req, res) => {
  const userId = req.userId;
  const productId = req.body?.productId;
  const quantity = req.body?.quantity || 1;

  if (!userId || !productId) {
    return res.status(400).json({ success: false, data: { message: "Bad Request" } });
  }

  const newCart = { userId, productId, quantity };

  cartModel.addCart(newCart, (error, result) => {
    if (error) {
      console.log("DB Error: ", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
    if (result) {
      return res.status(201).json({ success: true, data: { message: "Product added to cart successfully" } });
    }
  });
};

const deleteFromCart = (req, res) => {
  const userId = req.userId;
  const productId = req.body?.productId;

  if (!productId) {
    return res.status(400).json({ success: false, data: { message: "Bad Request" } });
  }

  cartModel.deleteCart(userId, productId, (error, result) => {
    if (error) {
      console.log("DB Error: ", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
    return res.status(200).json({ success: true, data: null });
  });
};

const getCart = (req, res) => {
  const userId = req.userId;

  cartModel.getCart(userId, (error, result) => {
    if (error) {
      console.log("DB Error: ", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
    return res.status(200).json({ success: true, data: { cart: result || [] } });
  });
};

module.exports = { addToCart, deleteFromCart, getCart };