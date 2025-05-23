const { createOrder, getUsersOrder, updateOrder } = require('../controllers/order.controller')
const verifyJWT = require('../middlewares/auth.middleware')

const router = require('express').Router()

router.use(verifyJWT)
router.post('/', createOrder)
router.patch('/:id', updateOrder);
router.get('/', getUsersOrder)


module.exports = router