const express = require("express");
const router = express.Router();
const orderModel = require("../models/order.model")
const orderMiddleware = require("../middleware/order.middleware")
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

function verifyUser(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Token is required" });
    }
    // if(token === "test_token"){
    //     next()
    // }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }
        req.userEmail = decoded.email;
        req.userId = decoded.id;
        next();
    });
}

router.post("/", verifyUser, orderMiddleware, (req, res) => {
    try {
        const amount = req.body?.totalAmount
        const userId = req.userId;
        const userEmail = req.userEmail;
        const address = req.body?.address?.trim()
        const phone = req.body?.phone
        const counter = req.body?.counter?.trim()
        const city = req.body?.city?.trim()
        const notes = req.body?.notes?.trim()
        const Payment_Method = req.body?.Payment_Method
        const newOrder = {
            Total_Amount: amount,
            user_id: userId
        }
        console.log(userEmail, userId);
        
        orderModel.createOrder(newOrder, (error, result) =>{
            if(error){
                console.log("DB Error: ", error);
                return res.status(500).json({ success: false, message: "Internal server error" });
            }
            if(result){
                const orderId = result.insertId
                newOrderDeltils = {
                    order_id: orderId,
                    email: userEmail,
                    phone: phone,
                    address: address,
                    city: city,
                    country: counter,
                    notes: notes
                }
            orderModel.createOrderDetails(newOrderDeltils, (error, result) => {
                if(error){
                    console.log("DB Error: ", error);
                    return res.status(500).json({ success: false, message: "Internal server error" });
                }
                if(result){
                    const newPayment = {
                        Payment_Method: Payment_Method,
                        order_id: orderId
                    }
                    console.log(newPayment);
                    
                orderModel.createPayment(newPayment, (error, result) =>{
                if(error){
                    console.log("DB Error: ", error);
                    return res.status(500).json({ success: false, message: "Internal server error" });
                }
                const finalOrder = {...newOrder,...newOrderDeltils,...newPayment}
                if(result){
                    return res.status(201).json({success: true, data:{message:"order create successfuly", order:finalOrder}})
                }
                })
            }
            })
        }
        })

    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
})

module.exports = router