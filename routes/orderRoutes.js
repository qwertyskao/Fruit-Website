const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, optionalProtect, admin } = require('../middlewares/authMiddleware');

// Khách có thể đặt hàng không cần đăng nhập; token hợp lệ sẽ gắn user vào đơn.
router.post('/', optionalProtect, createOrder);

// Khách hàng đã đăng nhập xem lịch sử đơn hàng của mình
router.get('/myorders', protect, getMyOrders);

// Admin quản lý toàn bộ đơn hàng
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
