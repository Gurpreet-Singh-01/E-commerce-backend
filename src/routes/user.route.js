const { register_user, verify_user } = require('../controllers/user.controller')

const router = require('express').Router()

router.post('/register_user', register_user)
router.post('/verify_user', verify_user)

module.exports = {router}
