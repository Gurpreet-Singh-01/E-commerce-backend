const { createOrder } = require('../controllers/order.controller')
const verifyJWT = require('../middlewares/auth.middleware')

const router = require('express').Router()

router.use(verifyJWT)
router.post('/', createOrder)
module.exports = router