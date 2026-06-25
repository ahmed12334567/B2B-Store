const {body, validationResult} = require("express-validator")

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
module.exports = {loginValidation , createProduct}