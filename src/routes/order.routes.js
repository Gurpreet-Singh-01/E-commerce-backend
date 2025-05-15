const { createOrder, getUsersOrder } = require('../controllers/order.controller')
const verifyJWT = require('../middlewares/auth.middleware')

const router = require('express').Router()

router.use(verifyJWT)
router.post('/', createOrder)
router.get('/', getUsersOrder)


module.exports = router