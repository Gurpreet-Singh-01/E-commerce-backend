const { addToCart, getCart } = require('../controllers/cart.controller');
const verifyJWT = require('../middlewares/auth.middleware');

const router = require('express').Router();


router.use(verifyJWT)
router.post('/',addToCart)
router.get('/',getCart)

module.exports = router