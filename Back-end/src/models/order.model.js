const pool = require("../config/db")

const order = {
    createOrder: (data, callback) => {
        const query = "INSERT INTO orders(Order_Status, order_date, Total_Amount, user_id) value('Pending', NOW(),?,?)"
        const orderData = [data.Total_Amount, data.user_id]
        pool.query(query, orderData, callback)
    },
    getAllOrders: (callback) => {
        const query = `SELECT users.name , users.email , orders.order_id, orders.Order_Status, orders.order_date , orders.Total_Amount , orders.createAt
                        FROM orders INNER JOIN users ON orders.user_id = users.user_id`
        pool.query(query, callback)
    },
    createOrderDetails: (data, callback) => {
        const query = "INSERT INTO shipping_details (order_id, email, phone, address, city, country, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const orderData = [data.order_id, data.email, data.phone, data.address, data.city, data.country, data.notes];
        pool.query(query, orderData, callback);
    },
    createPayment: (data, callback) => {
        const query = "INSERT INTO payment (Payment_Method, order_id, Payment_Status, Payment_Date ) VALUES (?,?, 'Pending', NOW())";
        const paymentData = [data.Payment_Method, data.order_id];
        pool.query(query, paymentData, callback);
    },
    deleteOrder: (order_id, callback)=>{
        const query = "DELETE FROM orders WHERE order_id = ?"
        const orderData = [order_id]
        pool.query(query,orderData,callback)
    }
}

module.exports = order