const Product = require('../models/Product');
const { escapeRegex } = require('../utils/sanitize');

// @desc    Lấy danh sách sản phẩm (hỗ trợ tìm kiếm, lọc theo danh mục)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { keyword, category, featured } = req.query;
    let query = {};

    if (keyword !== undefined) {
      if (typeof keyword !== 'string') {
        return res.status(400).json({ success: false, message: 'Từ khóa tìm kiếm không hợp lệ' });
      }

      const normalizedKeyword = keyword.trim();
      if (normalizedKeyword.length > 100) {
        return res.status(400).json({ success: false, message: 'Từ khóa tìm kiếm không được vượt quá 100 ký tự' });
      }

      if (normalizedKeyword) {
        query.name = { $regex: escapeRegex(normalizedKeyword), $options: 'i' };
      }
    }
    if (category) {
      query.category = category;
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Chỉ bật phân trang khi request có truyền ?page=.
    // Giữ nguyên hành vi cũ cho các frontend chưa hỗ trợ phân trang.
    if (req.query.page !== undefined) {
      const pageValue = req.query.page;
      const limitValue = req.query.limit;

      if (typeof pageValue !== 'string' || !/^\\d+$/.test(pageValue) || Number(pageValue) < 1) {
        return res.status(400).json({
          success: false,
          message: 'Tham số page phải là số nguyên dương',
        });
      }

      const page = Number(pageValue);
      const limit = limitValue === undefined ? 12 : Number(limitValue);

      if (
        (limitValue !== undefined && (typeof limitValue !== 'string' || !/^\\d+$/.test(limitValue))) ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          success: false,
          message: 'Tham số limit phải là số nguyên từ 1 đến 100',
        });
      }

      if (!Number.isSafeInteger(page)) {
        return res.status(400).json({
          success: false,
          message: 'Tham số page vượt quá giới hạn cho phép',
        });
      }

      const skip = (page - 1) * limit;
      if (!Number.isSafeInteger(skip)) {
        return res.status(400).json({
          success: false,
          message: 'Trang yêu cầu vượt quá giới hạn cho phép',
        });
      }

      const [products, totalProducts] = await Promise.all([
        Product.find(query)
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .populate('category', 'name'),
        Product.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalProducts / limit);

      return res.json({
        success: true,
        count: products.length,
        totalProducts,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1 && totalPages > 0,
        data: products,
      });
    }

    const products = await Product.find(query).populate('category', 'name');
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết 1 sản phẩm
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo sản phẩm mới (Hỗ trợ upload ảnh qua multer)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, category, price, discountPrice, description, unit, countInStock, isFeatured } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (req.file) {
      images = [`/uploads/${req.file.filename}`];
    } else if (req.body.imageUrl) {
      images = [req.body.imageUrl];
    } else if (req.body.image) {
      images = [req.body.image];
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const product = await Product.create({
      name,
      category,
      price,
      discountPrice: discountPrice || 0,
      description,
      unit: unit || 'kg',
      countInStock: countInStock || 0,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      images,
    });

    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (req.file) {
      req.body.images = [`/uploads/${req.file.filename}`];
    } else if (req.body.imageUrl) {
      req.body.images = [req.body.imageUrl];
    } else if (req.body.image) {
      req.body.images = [req.body.image];
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
