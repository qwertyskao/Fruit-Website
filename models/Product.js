const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên sản phẩm'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Vui lòng chọn danh mục'],
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá sản phẩm'],
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      default: 'kg', // ví dụ: kg, hộp, quả
    },
    images: [
      {
        type: String,
      },
    ],
    countInStock: {
      type: Number,
      required: [true, 'Vui lòng nhập số lượng tồn kho'],
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
