const User = require("../models/user.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");



const register_user = asyncHandler(async (req,res) =>{
    const {name,email,password} = req.body
    
    if(
        [name,email,password].some((field) => field.trim() === "")
    ) throw new APIError(401, "All fields are required")

    const isExistingUser = await User.findOne({email})

    if(isExistingUser) throw new APIError(409, "User with this email already exists!")
    
    const newUser = await User.create({
        name,
        email,
        password
    })
    const otp = await newUser.generatePasswordResetOTP()
    console.log(otp)
    const createdUser = await User.findById(newUser._id).select(
        "name email password role"
    );

    if(!createdUser) throw new APIError(500, "Something went wrong while creating user")

    return res.status(200).json(new APIResponse(200, createdUser, "User Created Successfully"))
})


module.exports={
    register_user,

}