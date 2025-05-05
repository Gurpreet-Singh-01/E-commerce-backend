const JWT = require('jsonwebtoken')
const User = require("../models/user.model");
const APIError = require("../utils/API_utilities/APIError");
const asyncHandler = require("../utils/API_utilities/asyncHandler");


const verifyJWT = asyncHandler(async(req,res,next) =>{
    const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ","");

    if(!token) throw new APIError(401, "Unauthorized Access")
    
    const decodedToken = await 
})