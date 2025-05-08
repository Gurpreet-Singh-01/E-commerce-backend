const { addCategory } = require('../controllers/category.controller')
const verifyJWT = require('../middlewares/auth.middleware')
const restrictToAdmin = require('../middlewares/restrictToAdmin.middleware')

const router = require('express').Router()

router.use(verifyJWT,restrictToAdmin)
router.post('/create_category', addCategory)

module.exports = router