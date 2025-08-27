const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const CORS = require("cors");
const errorMiddleware = require("./middlewares/error.middleware");
const userRouter = require("./routes/user.routes");
const productRouter = require("./routes/product.routes");
const categoryRouter = require("./routes/category.routes");
const cartRouter = require("./routes/cart.routes");
const orderRouter = require("./routes/order.routes");
const adminRouter = require("./routes/admin.routes");
const morgan = require("morgan");
const { cleanupUnverifiedUsers } = require("./utils/cronJobs");

app.use(morgan("dev"));
app.use(
  CORS({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/admin", adminRouter);
app.get("/api/v1/ping", (req,res) =>{
  res.status(200).json({message:"pong"})
})
app.use(errorMiddleware);
cleanupUnverifiedUsers()
module.exports = { app };
