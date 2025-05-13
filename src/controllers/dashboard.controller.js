const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const User = require("../models/user.model");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");

const getDashboardStatus = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalCustomers = await User.countDocuments({ role: "customer" });
  const totalProducts = await Product.countDocuments();

  const totalRevenue = await Order.aggregate([
    { $match: { "payment.status": { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  const totalOrdersByStatus = await Order.aggregate([
    { $group: { _id: "$payment.status", count: { $sum: 1 } } },
  ]);

  const totalOrdersByMethod = await Order.aggregate([
    { $group: { _id: "$payment.method", count: { $sum: 1 } } },
  ]);

  const stats = {
    totalOrders,
    totalCustomers,
    totalProducts,
    totalRevenue: totalRevenue[0]?.total || 0,
    ordersByStatus: totalOrdersByStatus.reduce((acc,{_id,count}) =>{
        acc[_id] = count
        return acc
    },{}),
    ordersByMethod: totalOrdersByMethod.reduce((acc,{_id,count}) =>{
        acc[_id] = count
    },{})
  }

  res.status(200)
  .json(new APIResponse(200, stats, "Dashboard stats fetched successfully"))
});

module.exports = {
  getDashboardStatus,
};
