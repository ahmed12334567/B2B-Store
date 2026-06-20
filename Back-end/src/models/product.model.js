const pool = require("../config/db")

const product = {
    getAllProduct: (callback) =>{
        const query = "SELECT * FROM products";
        pool.query(query, callback)
    },
    getProductByID: (params, callback) => {
        const query = "SELECT * FROM products where product_id = ?";
        pool.query(query, params, callback);
    }
}

module.exports = product;