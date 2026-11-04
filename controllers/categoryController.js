const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { isNonEmptyString } = require('../utils/validation');

// @desc    Lấy danh sách tất cả danh mục
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Thêm danh mục mới
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!isNonEmptyString(name)) {
      return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const category = await Category.create({ name: name.trim(), description, image });
    res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật danh mục
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ' });
    }
    if (req.body.name !== undefined && !isNonEmptyString(req.body.name)) {
      return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    if (req.body.name !== undefined) category.name = req.body.name.trim();
    if (req.body.description !== undefined) category.description = req.body.description;
    if (req.file) category.image = `/uploads/${req.file.filename}`;

    const updatedCategory = await category.save();
    res.json({ success: true, message: 'Cập nhật danh mục thành công', data: updatedCategory });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa danh mục (chỉ khi không còn sản phẩm)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Không thể xóa danh mục vì vẫn còn ${productCount} sản phẩm thuộc danh mục này`,
      });
    }

    await Category.deleteOne({ _id: category._id });
    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
