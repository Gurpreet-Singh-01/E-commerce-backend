const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const CORS = require('cors')

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
module.exports = {app}