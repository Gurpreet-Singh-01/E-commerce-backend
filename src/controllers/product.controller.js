const Category = require("../models/Category.model");
const Product = require("../models/Product.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");
const {
  uploadOnCloudinary,
  removeFromCloudinary,
} = require("../utils/services/cloudinary_service");

const addProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock } = req.body;
  const file = req.file;

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (
    !name?.trim() ||
    !description?.trim() ||
    !category?.trim() ||
    isNaN(parsedPrice) ||
    isNaN(parsedStock)
  ) {
    throw new APIError(400, "All fields are required and must be valid");
  }

  const isCategory = await Category.findById(category);
  if (!isCategory) throw new APIError(400, "Invalid Category ID");

  let image = {};
  if (file) {
    const result = await uploadOnCloudinary(file.path);
    if (!result)
      throw new APIError(500, "Failed to upload image to cloudinary");
    image = { url: result.secure_url, public_id: result.public_id };
  } else throw new APIError(400, "Image is required");

  const product = await Product.create({
    name,
    description: description.trim(),
    price: parsedPrice,
    category,
    stock: parsedStock,
    image,
  });
  return res
    .status(201)
    .json(new APIResponse(201, product, "Product created successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, stock } = req.body;
  const file = req.file;
  const product = await Product.findById(id);
  if (!product) throw new APIError(404, "Product not found");

  if (category) {
    const isCategory = await Category.findById(category);
    if (!isCategory) throw new APIError(400, "Invalid Category ID");
    product.category = category;
  }

  if (name) product.name = name;
  if (description) product.description = description;
  if (price) product.price = Number(price);
  if (stock) product.stock = Number(stock);

  if (file) {
    if (product?.image) {
      await removeFromCloudinary(product.image.public_id);
    }
    const result = await uploadOnCloudinary(file.path);
    if (!result)
      throw new APIError(500, "Failed to upload image to Cloudinary");
    product.image = { url: result.secure_url, public_id: result.public_id };
  }

  await product.save();
  return res
    .status(200)
    .json(new APIResponse(200, product, "Product Updated Successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new APIError(404, "Product not found");

  if (product.image) {
    await removeFromCloudinary(product.image.public_id);
  }

  await product.deleteOne();
  return res
    .status(200)
    .json(new APIResponse(200, {}, "Product Deleted Successfully"));
});

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate("category", "name");
  return res
    .status(200)
    .json(new APIResponse(200, products, "Products fetched successfully"));
});

const getProductByID = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).populate("category", "name");
  if (!product) throw new APIError(404, "Product not found");

  return res
    .status(200)
    .json(new APIResponse(200, product, "Products fetched successfully"));
});

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductByID,
};
