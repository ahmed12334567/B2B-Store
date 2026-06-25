const pool = require("../config/db")

const product = {
    getAllProduct: (callback) => {
        const query = "SELECT * FROM products";
        pool.query(query, callback)
    },
    getProductByID: (params, callback) => {
        const query = "SELECT * FROM products where product_id = ?";
        pool.query(query, params, callback);
    },
    getLastProduct: (callback) => {
        const query = "SELECT * FROM products ORDER BY product_id DESC LIMIT 5";
        pool.query(query, callback)
    },
    createProduct: (data, callback) => {
        const query = "INSERT INTO products (product_name, Stock_Quantity, description, price, category_id, imgURL ) value(?,?,?,?,?,?)";
        const dataProduct = [data.name, data.Quantity, data.description, data.price, data.category_id, data.imgURL]
        pool.query(query, dataProduct, callback)
    },
    getStatus: (callback)=> {
        const queries = {
        totalUsers: "SELECT COUNT(*) as count FROM users",
        totalProducts: "SELECT COUNT(*) as count FROM products",
        totalOrders: "SELECT COUNT(*) as count FROM orders",
        recentUsers: `SELECT user_id, name, email FROM users WHERE role = "customer" ORDER BY user_id DESC LIMIT 5 `,
        recentProducts: `SELECT product_id, product_name,Stock_Quantity,description, price, imgURL FROM products ORDER BY product_id DESC LIMIT 5`
    };
    pool.query(queries, callback)
    }

}

module.exports = product;