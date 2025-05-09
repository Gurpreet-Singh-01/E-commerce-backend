const Category = require("../models/Category.model");
const Product = require("../models/Product.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");
const mongoose = require("mongoose");
const addCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) throw new APIError(400, "Category field cannot be empty");
  const category = await Category.create({ name: name.trim() });
  return res
    .status(201)
    .json(new APIResponse(201, category, "Category created Successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid Category ID");
  }
  const category = await Category.findById(id);
  if (!category) throw new APIError(404, "Category not found");
  if (!name) throw new APIError(400, "Category name cannot be empty");
  category.name = name;
  await category.save();
  return res
    .status(200)
    .json(new APIResponse(200, category, "Category updated successfully"));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid Category ID");
  }

  const category = await Category.findById(id);

  if (!category) throw new APIError(404, "Category not found");
  const products = await Product.find({ category: id });
  if (products.length > 0)
    throw new APIError(400, "Cannot delete category with associated products");
  await category.deleteOne();

  return res.status(200).json(new APIResponse(200, {}, "Category Deleted Successfully"));
});
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  return res.status(200).json(new APIResponse(200, categories, "Categories fetched Successfully"))
});

module.exports = {
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
};
