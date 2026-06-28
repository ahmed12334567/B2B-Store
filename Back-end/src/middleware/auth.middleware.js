const {body, validationResult} = require("express-validator")
const jwt = require("jsonwebtoken");
require("dotenv").config();

const validationLogin = [
  body("email")
    .notEmpty()
    .isEmail()
    .withMessage("Email is not valid"),

body("password")
  .if((value, { req }) => !["true", true].includes(req.body.isGoogleUser))
  .isLength({ min: 8 }),

  body("googleIdToken")
    .if((value, { req }) => req.body?.isGoogleUser === true || req.body?.isGoogleUser === "true")
    .notEmpty()
    .withMessage("Google Token Required"),

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
];
let JWT_SECRET = process.env.JWT_SECRET;
const verifyUser = 
function verifyUserf(req, res, next) {
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
module.exports = {validationLogin, verifyUser}