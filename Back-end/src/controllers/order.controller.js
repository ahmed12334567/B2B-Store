const express = require("express");
const router = express.Router();
const orderModel = require("../models/order.model")
const orderMiddleware = require("../middleware/order.middleware")
const {verifyUser} = require("../middleware/auth.middleware")

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
        
        orderModel.createOrder(newOrder, (error, result) =>{
            if(error){
                console.log("DB Error: ", error);
                return res.status(500).json({ success: false, message: "Internal server error" });
            }
            if(result){
                const orderId = result.insertId
                const orderTime = result.createAt
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
                    
                orderModel.createPayment(newPayment, (error, result) =>{
                if(error){
                    console.log("DB Error: ", error);
                    return res.status(500).json({ success: false, message: "Internal server error" });
                }
                const finalOrder = {...newOrder,...newOrderDeltils,...newPayment,...orderTime}
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