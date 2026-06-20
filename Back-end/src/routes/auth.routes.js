const express = require("express");
const router = express.Router();
const userController = require("../controllers/auth.controller");
const validationLogin = require('../middleware/auth.middleware')
const validationLoginAdmin = require("../middleware/admin.middleware")
router.post("/register",  userController);
router.post("/login", validationLogin, userController);
router.post("/login/admin", validationLoginAdmin, userController);
router.post("/google-data", userController);
router.get("/user", userController);


module.exports = router;