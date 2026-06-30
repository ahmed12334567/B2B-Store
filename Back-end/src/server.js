const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan")
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'), 
    { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));
// ===== Middlewares =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const authRoutes = require("./routes/auth.routes.js")
app.use("/api/auth", authRoutes)

const productRoutes = require("./routes/product.routes.js")
app.use("/api/products", productRoutes)

const orderRout = require("./routes/order.routes.js")
app.use("/api/order", orderRout)

const dashboardRoutes = require("./routes/dashboard.routes.js")
app.use("/api/dashboard", dashboardRoutes)

const cartRoutes = require("./routes/cart.routes.js")
app.use("/api/cart", cartRoutes)

// ===== JSON Parse Error Handler =====
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
