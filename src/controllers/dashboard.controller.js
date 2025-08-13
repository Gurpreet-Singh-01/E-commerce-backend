const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const User = require("../models/User.model");
const APIError = require("../utils/API_utilities/APIError");
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
    ordersByStatus: totalOrdersByStatus.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {}),
    ordersByMethod: totalOrdersByMethod.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {}),
  };

  res
    .status(200)
    .json(new APIResponse(200, stats, "Dashboard stats fetched successfully"));
});

const getRecentOrders = asyncHandler(async (req, res) => {
  const { status, method } = req.query;

  const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
  const validMethods = ["cod", "online"];

  const query = {};

  if (status && !validStatuses.includes(status))
    throw new APIError(400, "Invalid status filter");
  if (method && !validMethods.includes(method))
    throw new APIError(400, "Invalid method filter");

  if (status) {
    query["payment.status"] = status;
  }

  if (method) {
    query["payment.method"] = method;
  }

  const recentOrders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(10)
    .populate({
      path: "items.product",
      select: "name image price stock category",
      populate: {
        path: "category",
        select: "name",
      },
    })
    .populate("user", "name email");

  res
    .status(200)
    .json(
      new APIResponse(200, recentOrders, "Recent Orders fetched successfully")
    );
});

const getTopProducts = asyncHandler(async (req, res) => {
  const topProducts = await Order.aggregate([
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.product",
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.quantity", "$items.price"] },
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },

    {
      $project: {
        name: "$product.name",
        image: "$product.image.url",
        category: "$category.name",
        totalRevenue: 1,
        totalQuantity: 1,
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    {
      $limit: 5,
    },
  ]);
  res.status(200).json(
    new APIResponse(200, topProducts, "Top products retrieved successfully")
  );
});

module.exports = {
  getDashboardStatus,
  getRecentOrders,
  getTopProducts,
};
