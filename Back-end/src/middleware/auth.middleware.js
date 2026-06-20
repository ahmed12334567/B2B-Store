const {body, validationResult} = require("express-validator")

const loginValidation = [
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
module.exports = loginValidation