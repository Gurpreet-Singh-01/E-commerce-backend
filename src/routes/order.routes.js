const { createOrder, getUsersOrder,verifyPayment } = require('../controllers/order.controller')
const verifyJWT = require('../middlewares/auth.middleware')

const router = require('express').Router()

router.use(verifyJWT)
router.post('/', createOrder)
router.get('/', getUsersOrder)
router.post('/verify', verifyPayment);


module.exports = router