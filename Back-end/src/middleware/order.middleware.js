const {body, validationResult} = require("express-validator")

const orderValidation = [
    body("address")
    .notEmpty()
    .withMessage("address is requried"),
    body("counter")
    .notEmpty()
    .withMessage("counter is requried"),
    body("city")
    .notEmpty()
    .withMessage("city is requried"),
    body("totalAmount")
    .notEmpty()
    .isInt()
    .withMessage("amount is requried"),
    body("Payment_Method")
    .notEmpty()
    .withMessage("price is requried"),
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
module.exports = orderValidation