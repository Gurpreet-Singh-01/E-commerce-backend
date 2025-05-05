require("dotenv").config({
  path: "./.env",
});
const JWT = require("jsonwebtoken");
const User = require("../models/user.model");
const APIError = require("../utils/API_utilities/APIError");
const asyncHandler = require("../utils/API_utilities/asyncHandler");

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers("Authorization")?.replace("Bearer ", "");

    if (!token) throw new APIError(401, "Unauthorized Access");

    const decodedToken = await JWT.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET_KEY
    );
    const user = await User.findById(decodedToken?._id).select(
      "-refreshToken -password"
    );
    if (!user) throw new APIError(401, "Invalid Access Token");
    req.user = user;
    next();
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid Access Token")
  }
});

module.exports = verifyJWT;
