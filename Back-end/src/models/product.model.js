const pool = require("../config/db")

const product = {
    getAllProduct: (callback) => {
        const query = "SELECT * FROM products ORDER BY product_id DESC";
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
        const query = "INSERT INTO products (product_name, Stock_Quantity, description, price, category_id, imgURL ) values (?,?,?,?,?,?)";
        const dataProduct = [data.name, data.Quantity, data.description, data.price, data.category_id, data.imgURL]
        console.log(data);        
        console.log(dataProduct);
        pool.query(query, dataProduct, callback)
    },
    deletPrdouct: (product_id, callback) =>{
        const query = "DELETE FROM products WHERE product_id = ?"
        const deleteData = [product_id]
        pool.query(query, deleteData, callback)
    }

}

module.exports = product;