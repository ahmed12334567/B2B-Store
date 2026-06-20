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
module.exports = loginValidation