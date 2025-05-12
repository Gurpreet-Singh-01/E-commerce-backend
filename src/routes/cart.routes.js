const verifyJWT = require('../middlewares/auth.middleware');

const router = require('express').Router();


router.use(verifyJWT)


module.exports = router