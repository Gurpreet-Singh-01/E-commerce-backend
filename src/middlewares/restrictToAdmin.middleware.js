const APIError = require("../utils/API_utilities/APIError");
const asyncHandler = require("../utils/API_utilities/asyncHandler");

const restrictToAdmin = asyncHandler((req,res,next) =>{
    if(req.user?.role !== 'admin') throw new APIError(403,"Forbidden Access")
    next()
})

module.exports = restrictToAdmin