const { addCategory, updateCategory, deleteCategory, getAllCategories } = require('../controllers/category.controller')
const verifyJWT = require('../middlewares/auth.middleware')
const restrictToAdmin = require('../middlewares/restrictToAdmin.middleware')

const router = require('express').Router()

router.get('/', getAllCategories)
router.use(verifyJWT)
router.use(restrictToAdmin)
router.post('/', addCategory)
router.patch('/:id', updateCategory)
router.delete('/:id',deleteCategory)


module.exports = router