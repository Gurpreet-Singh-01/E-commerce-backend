const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const CORS = require('cors')
const errorMiddleware = require('./middlewares/error.middleware')
const { router } = require('./routes/user.route')

app.use(
    CORS(
        {
            origin:process.env.CORS_ORIGIN,
            credentials:true
        }
    )
)


app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({limit:'16kb'}))
app.use(cookieParser())
app.use(express.static("public"))

// Routes
app.use('/api/v1/user',router)



app.use(errorMiddleware)
module.exports = {app}