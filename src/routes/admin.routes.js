const { getDashboardStatus, getRecentOrders } = require('../controllers/dashboard.controller');
const { getAllOrders, updateOrderStatus, cancelOrder } = require('../controllers/order.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const restrictToAdmin = require('../middlewares/restrictToAdmin.middleware');

const router = require('express').Router();

router.use(verifyJWT)
router.use(restrictToAdmin);
router.get('/order/all_orders', getAllOrders)
router.patch('/order/:id/status', updateOrderStatus)
router.patch('/order/:id/cancel', cancelOrder)

// Admin Dashboard
router.get('/dashboard/stats', getDashboardStatus)
router.get('/dashboard/recent_orders',getRecentOrders)

module.exports = router