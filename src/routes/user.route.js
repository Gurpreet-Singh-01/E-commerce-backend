const { register_user } = require('../controllers/user.controller')

const router = require('express').Router()

router.post('/register_user', register_user)

module.exports = {router}
