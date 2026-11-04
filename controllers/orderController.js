const Order = require('../models/Order');
const sendEmail = require('../utils/sendMail');

// @desc    Tạo đơn hàng mới & Gửi email xác nhận
// @route   POST /api/orders
// @access  Public (hoặc Private nếu có token)
const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const order = new Order({
      user: req.user ? req.user._id : null,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: itemsPrice || 0,
      shippingPrice: shippingPrice || 0,
      totalPrice,
    });

    const createdOrder = await order.save();

    // Tự động gửi email xác nhận đặt hàng nếu người mua có email
    if (shippingAddress && shippingAddress.email) {
      try {
        const itemsHtml = orderItems
          .map(
            (item) =>
              `<tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.qty}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.price.toLocaleString('vi-VN')} đ</td>
              </tr>`
          )
          .join('');

        const emailContent = `
          <h2>Cảm ơn bạn đã đặt hàng tại Fruitables!</h2>
          <p>Mã đơn hàng của bạn: <strong>#${createdOrder._id}</strong></p>
          <p>Người nhận: ${shippingAddress.fullName} - SĐT: ${shippingAddress.phone}</p>
          <p>Địa chỉ giao hàng: ${shippingAddress.address}, ${shippingAddress.city || ''}</p>
          <h3>Chi tiết đơn hàng:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; border: 1px solid #ddd;">Sản phẩm</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Số lượng</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="margin-top: 15px; font-size: 16px;"><strong>Tổng thanh toán: ${totalPrice.toLocaleString('vi-VN')} đ</strong></p>
          <p>Phương thức thanh toán: <strong>${paymentMethod}</strong></p>
          <br>
          <p>Chúng tôi sẽ liên hệ để xác nhận và giao hàng sớm nhất!</p>
        `;

        await sendEmail({
          to: shippingAddress.email,
          subject: `[Fruitables] Xác nhận đơn hàng #${createdOrder._id}`,
          html: emailContent,
        });
      } catch (emailErr) {
        console.warn('⚠️ Gửi email xác nhận thất bại (vui lòng kiểm tra lại cấu hình email trong .env):', emailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: createdOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách đơn hàng của người dùng hiện tại
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy toàn bộ đơn hàng (Dành cho Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật trạng thái đơn hàng (Dành cho Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, isPaid } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (isPaid !== undefined) {
      order.isPaid = isPaid;
      if (isPaid) order.paidAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json({ success: true, message: 'Cập nhật đơn hàng thành công', data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
