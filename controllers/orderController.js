const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendMail');

// Phí vận chuyển: miễn phí từ 300.000đ, dưới mức này là 30.000đ.
const FREE_SHIPPING_THRESHOLD = 300000;
const STANDARD_SHIPPING_FEE = 30000;

// @desc    Tạo đơn hàng mới & Gửi email xác nhận
// @route   POST /api/orders
// @access  Public (hoặc Private nếu có token)
const createOrder = async (req, res, next) => {
  try {
    const { orderItems: requestedItems, shippingAddress, paymentMethod } = req.body;

    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống hoặc không hợp lệ' });
    }

    // Chỉ nhận ID sản phẩm và số lượng. Không sử dụng giá/tên/tổng tiền từ client.
    const normalizedItems = [];
    for (const item of requestedItems) {
      const productId = item?.product || item?.productId;
      const qty = Number(item?.qty);

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
      }

      if (!Number.isSafeInteger(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Số lượng sản phẩm phải là số nguyên dương' });
      }

      normalizedItems.push({ productId, qty });
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));

    const missingProduct = productIds.find((id) => !productsById.has(id.toString()));
    if (missingProduct) {
      return res.status(400).json({ success: false, message: 'Một hoặc nhiều sản phẩm không tồn tại' });
    }

    const calculatedOrderItems = normalizedItems.map(({ productId, qty }) => {
      const product = productsById.get(productId.toString());
      const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(`Giá sản phẩm không hợp lệ: ${product.name}`);
      }

      return {
        product: product._id,
        name: product.name,
        qty,
        price: unitPrice,
        image: product.images?.[0] || '',
      };
    });

    const itemsPrice = calculatedOrderItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const shippingPrice =
      itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING_FEE;
    const totalPrice = itemsPrice + shippingPrice;

    const order = new Order({
      user: req.user ? req.user._id : null,
      orderItems: calculatedOrderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // Tự động gửi email xác nhận đặt hàng nếu người mua có email
    if (shippingAddress && shippingAddress.email) {
      try {
        const itemsHtml = calculatedOrderItems
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
