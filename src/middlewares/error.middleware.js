const APIResponse = require("../utils/API_utilities/APIResponse")

const errorMiddleware = (err,req,res,next) =>{
    const statusCode = err.statusCode || 500

    const response = new APIResponse(
        statusCode,
        null,
        err.message || "Internal Server Error"
    )
    return res.status(statusCode).json(response)
}

module.exports = errorMiddleware