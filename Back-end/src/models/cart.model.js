const pool = require("../config/db");

const cart = {
  addCart: (data, callback) => {
    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle re-adding same product
    const query = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `;
    const cartData = [data.userId, data.productId, data.quantity];
   pool.execute(query, cartData, callback);
  },

  deleteCart: (userId, productId, callback) => {
    const query = "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?";
   pool.execute(query, [userId, productId], callback);
  },

  getCart: (userId, callback) => {
    const query = `
      SELECT
        cart_items.quantity,
        products.product_id,
        products.product_name,
        products.price,
        products.imgURL
      FROM cart_items
      INNER JOIN products ON cart_items.product_id = products.product_id
      WHERE cart_items.user_id = ?
    `;
   pool.execute(query, [userId], callback);
  }
};

module.exports = cart;