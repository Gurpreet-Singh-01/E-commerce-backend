const { createOrder, getUsersOrder, getOrderbyId, getAllOrders } = require('../controllers/order.controller')
const verifyJWT = require('../middlewares/auth.middleware')

const router = require('express').Router()

router.use(verifyJWT)
router.post('/', createOrder)
router.get('/', getUsersOrder)
router.get('/:id',getOrderbyId)

module.exports = router