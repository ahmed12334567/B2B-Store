const express = require("express");
const router = express.Router();
const userController = require("../controllers/auth.controller");
const {validationLogin} = require('../middleware/auth.middleware')
const {loginValidation} = require("../middleware/admin.middleware")
router.post("/register",  userController);
router.post("/login", validationLogin, userController);
router.post("/login/admin", loginValidation, userController);
router.post("/google-data", userController);
router.get("/user", userController);


module.exports = router;