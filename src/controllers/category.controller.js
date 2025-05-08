const Category = require("../models/Category.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");


const addCategory = asyncHandler(async(req,res) =>{
    const {name} = req.body

    if(!name) throw new APIError(400, "Caategory field cannot be empty")
    const category = await Category.create({name:name.trim()})
    return res.status(201)
    .json(new APIResponse(201, category, "Category created Successfully"))
})
const updateCategory = asyncHandler(async(req,res) =>{

})
const deleteCategory = asyncHandler(async(req,res) =>{

})
const getAllCategories = asyncHandler(async(req,res) =>{

})

module.exports = {
    addCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
}