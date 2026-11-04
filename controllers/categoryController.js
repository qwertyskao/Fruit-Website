const Category = require('../models/Category');
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

    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const category = await Category.create({ name, description, image });
    res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa danh mục
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
