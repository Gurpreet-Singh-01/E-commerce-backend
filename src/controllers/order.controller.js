const Cart = require("../models/Cart.model");
const Order = require("../models/Order.model");
const User = require("../models/user.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");

const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${date}-${random}`;
};

const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { addressId, shippingAddress, paymentMethod } = req.body;

  //   Payment
  const validPaymentMethods = ["cod", "online"];
  const selectedPaymentMethod = paymentMethod || "online";
  if (!validPaymentMethods.includes(selectedPaymentMethod))
    throw new APIError(400, "Invalid Payment Method");

  //   address

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
      throw new APIError(400, "Complete shipping addresss is required");

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
      throw new APIError(400, "No default address set and no address Provided");

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

  //   cart

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
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
    totalAmount += item.product.price * item.quantity;
    orderItems.push({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    });
  }
  const order = await Order.create({
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
  });

  cart.items = [];
  await cart.save();
  await order.populate("items.product", "name price image category stock");

  return res
    .status(201)
    .json(new APIResponse(201, order, "Order Created Successfully"));
});

const getUsersOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orders = await Order.find({ user: userId }).populate(
    "items.product",
    "name category price image stock"
  );
  return res
    .status(200)
    .json(new APIResponse(200, orders, "Orders fetched successfully"));
});

const getOrderbyId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const order = await Order.findById(id).populate(
    "items.product",
    "name category image stock price"
  );
  if (!order) throw new APIError(404, "Order not found");
  // admin and logged in user only
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
    .populate("items.product", "name price image category stock")
    .populate("user", "name email");

    res.status(200).json(new APIResponse(200, orders, "Orders fetced Successfully"))
});


module.exports = {
  createOrder,
  getUsersOrder,
  getOrderbyId,
  getAllOrders,
};
