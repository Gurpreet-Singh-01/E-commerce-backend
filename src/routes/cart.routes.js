const { addToCart } = require('../controllers/cart.controller');
const verifyJWT = require('../middlewares/auth.middleware');

const router = require('express').Router();


router.use(verifyJWT)
router.post('/',addToCart)

module.exports = router