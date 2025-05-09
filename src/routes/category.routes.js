const { addCategory, updateCategory, deleteCategory, getAllCategories } = require('../controllers/category.controller')
const verifyJWT = require('../middlewares/auth.middleware')
const restrictToAdmin = require('../middlewares/restrictToAdmin.middleware')

const router = require('express').Router()

router.use(verifyJWT,restrictToAdmin)
router.post('/', addCategory)
router.patch('/:id', updateCategory)
router.delete('/:id',deleteCategory)
router.get('/', getAllCategories)


module.exports = router