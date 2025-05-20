const Cart = require("../models/Cart.model");
const Order = require("../models/Order.model");
const User = require("../models/user.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");
const mongoose = require('mongoose')
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${date}-${random}`;
};


const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { addressId, shippingAddress, paymentMethod } = req.body;

  const validPaymentMethods = ["cod", "online"];
  const selectedPaymentMethod = paymentMethod || "online";
  if (!validPaymentMethods.includes(selectedPaymentMethod))
    throw new APIError(400, "Invalid Payment Method");

  
  let finalAddress;
  if (addressId) {
    const user = await User.findById(userId, "address");
    if (!user) throw new APIError(404, "User not found");

    const address = user.address.id(addressId);
    if (!address) throw new APIError(400, "Invalid Address ID");

    finalAddress = {
      houseNumber: address.houseNumber,
      street: address.street,
      colony: address.colony,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
    };
  } else if (shippingAddress) {
    const { houseNumber, street, colony, city, state, country, postalCode } =
      shippingAddress;
    if (
      !houseNumber ||
      !street ||
      !colony ||
      !city ||
      !state ||
      !country ||
      !postalCode
    )
      throw new APIError(400, "Complete shipping address is required");

    finalAddress = {
      houseNumber,
      street,
      colony,
      city,
      state,
      country,
      postalCode,
    };
  } else {
    const user = await User.findById(userId, "address");
    if (!user) throw new APIError(404, "User not found");

    const defaultAddress = user.address.find((addr) => addr.isDefault);
    if (!defaultAddress)
      throw new APIError(400, "No default address set and no address provided");

    finalAddress = {
      houseNumber: defaultAddress.houseNumber,
      street: defaultAddress.street,
      colony: defaultAddress.colony,
      city: defaultAddress.city,
      state: defaultAddress.state,
      country: defaultAddress.country,
      postalCode: defaultAddress.postalCode,
    };
  }

  
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .session(session);
    if (!cart || !cart.items.length) throw new APIError(400, "Cart is empty");

    let totalAmount = 0;
    let orderItems = [];
    for (const item of cart.items) {
      if (!item.product) throw new APIError(400, "Invalid product in the cart");
      if (item.product.stock < item.quantity)
        throw new APIError(
          400,
          `Only ${item.product.stock} of ${item.product.name} is available`
        );
      // Decrease stock
      item.product.stock -= item.quantity;
      if (item.product.stock < 0)
        throw new APIError(400, `Insufficient stock for ${item.product.name}`);
      await item.product.save({ session });

      totalAmount += item.product.price * item.quantity;
      orderItems.push({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      });
    }

    const order = await Order.create(
      [
        {
          user: userId,
          orderNumber: generateOrderNumber(),
          items: orderItems,
          totalAmount,
          shippingAddress: finalAddress,
          payment: {
            method: selectedPaymentMethod,
            transactionId: selectedPaymentMethod === "cod" ? null : "pending",
            status: "pending",
          },
        },
      ],
      { session }
    );

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    await order[0].populate("items.product", "name price image category stock");

    return res
      .status(201)
      .json(new APIResponse(201, order[0], "Order Created Successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const getUsersOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orders = await Order.find({ user: userId }).populate({
    path: "items.product",
    select: "name category image stock price",
    populate: {
      path: "category",
      select: "name",
    },
  });
  return res
    .status(200)
    .json(new APIResponse(200, orders, "Orders fetched successfully"));
});

const getOrderbyId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const order = await Order.findById(id).populate({
    path: "items.product",
    select: "name category image stock price",
    populate: {
      path: "category",
      select: "name",
    },
  });
  if (!order) throw new APIError(404, "Order not found");
  if (order.user.toString() !== userId.toString() && req.user.role !== "admin")
    throw new APIError(403, "Unauthorized to view this order");
  res
    .status(200)
    .json(new APIResponse(200, order, "Order fetched successfully"));
});



// Admin only

const getAllOrders = asyncHandler(async (req, res) => {
  const { status, method } = req.query;

  const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
  const validMethods = ["cod", "online"];

  if (status && !validStatuses.includes(status))
    throw new APIError(400, "Invalid status filter");
  if (method && !validMethods.includes(method))
    throw new APIError(400, "Invalid payment method filter");

  const query = {};

  if (status) {
    query["payment.status"] = status;
  }
  if (method) {
    query["payment.method"] = method;
  }
  const orders = await Order.find(query)
    .populate(
      {
        path:"items.product",
        select:"name category image stock price",
        populate:{
          path:"category",
          select:"name"
        }
      }
    )
    .populate("user", "name email");

  res
    .status(200)
    .json(new APIResponse(200, orders, "Orders fetced Successfully"));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (
    !status ||
    !["pending", "shipped", "delivered", "cancelled"].includes(status)
  )
    throw new APIError(400, "Invalid Status");
  const order = await Order.findById(id);
  if (!order) throw new APIError(404, "Order not found");

  order.payment.status = status;
  await order.save();

  await order.populate("items.product", "name price image category stock");
  res
    .status(200)
    .json(new APIResponse(200, order, "Order status updated successfully"));
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) {
    throw new APIError(404, "Order not found");
  }

  if (order.payment.status === "cancelled") {
    throw new APIError(400, "Order is already cancelled");
  }

  order.payment.status = "cancelled";
  await order.save();

  await order.populate("items.product", "name price image category stock");
  res
    .status(200)
    .json(new APIResponse(200, order, "Order cancelled successfully"));
});

module.exports = {
  createOrder,
  getUsersOrder,
  getOrderbyId,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};
