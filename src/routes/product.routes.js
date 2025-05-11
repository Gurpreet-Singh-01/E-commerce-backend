const { addProduct, updateProduct, deleteProduct, getProducts, getProductByCategory, getProductByID } = require('../controllers/product.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const restrictToAdmin = require('../middlewares/restrictToAdmin.middleware');

const router = require('express').Router();


// Protected Admin only Routes


router.get('/', getProducts )
router.get('/:id', getProductByID )
router.use(verifyJWT,restrictToAdmin)

router.post('/', upload.single("image"), addProduct)
router.patch('/:id', upload.single("image"), updateProduct)
router.delete('/:id',deleteProduct);



module.exports = router 