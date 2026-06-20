const express = require("express");
const router = express.Router();
const productModel = require("../models/product.model");

router.get("/:id", (req, res) =>{
    const productID = req.params.id;
    productModel.getProductByID([productID], (err, result)=>{
        if(err){
            console.error("Error Fetching product: ", err)
            return res.status(500).json({success: false, message: "Internal Server Error"})
        }
        if(result && result.length > 0){
            return res.status(200).json({success: true, data: result})
        }
        else{
            return res.status(404).json({success: false, field: "product", message: "Product not found"})
        }
    })
})

router.get("/", async (req, res) =>{
    productModel.getAllProduct((error, result) =>{
        if(error){
            console.error("Error Fetching product: ", err)
            return res.status(500).json({success: false, message: "Internal Server Error"})
        }
         if(result && result.length > 0){
            return res.status(200).json({success: true, data: result})
        }
        else{
            return res.status(404).json({success: false, field: "product", message: "Product not found"})
        }
    })
})

module.exports = router;