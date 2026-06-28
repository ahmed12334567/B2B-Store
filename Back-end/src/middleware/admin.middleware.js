const {body, validationResult} = require("express-validator")
const jwt = require("jsonwebtoken");
require("dotenv").config();
const loginValidation = [
    body("email")
    .notEmpty()
    .isEmail()
    .withMessage("Email invalid"),
    body("password")
    .notEmpty()
    .isLength({min: 8}),
      (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      const firstError = error.array()[0];
      return res.status(400).json({
        success: false,
        message: firstError.msg,
        data: { errors: error.array() }
      });
    }

    next();
  }
]

const createProduct = [
  body("productName")
  .notEmpty()
  .isLength({min: 8})
  .withMessage("product name is min length 8"),
  body("price")
  .notEmpty()
  .isInt()
  .withMessage("product price is requried"),
  body("category")
  .notEmpty()
  .withMessage("category is requried"),
    (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      const firstError = error.array()[0];
      return res.status(400).json({
        success: false,
        message: firstError.msg,
        data: { errors: error.array() }
      });
    }

    next();
  }

]
let JWT_SECRET = process.env.JWT_SECRET;
const verifyAdmin = 
function verifyAdminf(req, res, next) {
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
        req.adminEmail = decoded.email;
        req.adminId = decoded.id;
        next();
    });
}
module.exports = {loginValidation , createProduct, verifyAdmin}