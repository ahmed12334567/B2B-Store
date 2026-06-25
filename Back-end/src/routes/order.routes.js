const express = require("express");
const router = express.Router();
const orderContral = require("../controllers/order.controller")

router.post("/", orderContral)

module.exports = router