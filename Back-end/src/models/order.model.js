const pool = require("../config/db")

const order = {
    createOrder: (data, callback) => {
        const query = "INSERT INTO orders(Order_Status, order_date, Total_Amount, user_id) value('Pending', NOW(),?,?)"
        const orderData = [data.Total_Amount, data.user_id]
        pool.query(query, orderData, callback)
    },
    getAllOrders: (callback) => {
        const query = `SELECT users.name , users.email , orders.Order_Status, orders.order_date , orders.Total_Amount 
                        FROM orders INNER JOIN users ON orders.user_id = users.user_id`
        pool.query(query, callback)
    },
    createOrderDetails: (data, callback) => {
        // تم تعديل عدد علامات الاستفهام إلى 7 لتطابق عدد الحقول والمصفوفة، وتعديل VALUE إلى VALUES
        const query = "INSERT INTO shipping_details (order_id, email, phone, address, city, country, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";

        const orderData = [data.order_id, data.email, data.phone, data.address, data.city, data.country, data.notes];

        pool.query(query, orderData, callback);
    },
    createPayment: (data, callback) => {
        // تم تعديل VALUE إلى VALUES وهو الأفضل برمجياً
        const query = "INSERT INTO payment (Payment_Method, order_id, Payment_Status, Payment_Date ) VALUES (?,?, 'Pending', NOW())";

        // المصفوفة يجب أن تحتوي على قيمتين فقط لتطابق علامات الاستفهام بالترتيب
        const paymentData = [data.Payment_Method, data.order_id];

        pool.query(query, paymentData, callback);
    }
}

module.exports = order