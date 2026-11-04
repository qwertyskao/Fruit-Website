const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Cho phép cả khách vãng lai không cần đăng nhập
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        qty: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/, 'Email không đúng định dạng'],
      },
      address: { type: String, required: true },
      city: { type: String, default: '' },
      note: { type: String, default: '' },
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Banking'],
      default: 'COD',
    },
    itemsPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Delivering', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
