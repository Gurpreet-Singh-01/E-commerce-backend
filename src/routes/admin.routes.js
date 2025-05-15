const { getDashboardStatus, getRecentOrders, getTopProducts } = require('../controllers/dashboard.controller');
const { getAllOrders, updateOrderStatus, cancelOrder, getOrderbyId } = require('../controllers/order.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const restrictToAdmin = require('../middlewares/restrictToAdmin.middleware');

const router = require('express').Router();

router.use(verifyJWT)
router.use(restrictToAdmin);
// Admin Dashboard
router.get('/order/all_orders', getAllOrders)
router.get('/order/:id/user',getOrderbyId)
router.patch('/order/:id/status', updateOrderStatus)
router.patch('/order/:id/cancel', cancelOrder)

router.get('/dashboard/stats', getDashboardStatus)
router.get('/dashboard/recent_orders',getRecentOrders)
router.get('/dashboard/top_products',getTopProducts)

module.exports = router