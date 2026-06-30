const pool = require("../config/db");


const dashboard = {
    totalUser: (callback) =>{
        const query = "SELECT COUNT(*) as count FROM users"
        pool.query(query, callback)
    },
    totalProducts: (callback) =>{
        const query = "SELECT COUNT(*) as count FROM products"
        pool.query(query, callback)
    },
    totalOrders: (callback) =>{
        const query = "SELECT COUNT(*) as count FROM orders"
        pool.query(query, callback)
    },
    recentUsers: (callback) =>{
        const query = `SELECT user_id, name, email FROM users WHERE role = "customer" ORDER BY user_id DESC LIMIT 5`
        pool.query(query, callback)
    },
    recentProducts: (callback) =>{
        const query = `SELECT product_id, product_name,Stock_Quantity,description, price, imgURL FROM products ORDER BY product_id DESC LIMIT 5`
        pool.query(query, callback)
    },
    createProducts: (products, callback) => {
    const query = `
        INSERT INTO products
        (
            product_name,
            Stock_Quantity,
            description,
            price,
            category_id,
            imgURL
        )
        VALUES ?
    `;
    const data = products.map(product => [
        product.name,
        product.Quantity,
        product.description,
        product.price,
        product.category_id,
        product.imgURL
    ]);
    pool.query(query, [data], callback)
}
    
}

module.exports = dashboard