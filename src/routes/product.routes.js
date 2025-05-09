const verifyJWT = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const restrictToAdmin = require('../middlewares/restrictToAdmin.middleware');

const router = require('express').Router();


// router.post('/add_product', verifyJWT, restrictToAdmin, upload.single("image"))

module.exports = router 