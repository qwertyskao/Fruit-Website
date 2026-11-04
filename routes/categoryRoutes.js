const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.route('/')
  .get(getCategories)
  .post(protect, admin, upload.single('image'), createCategory);

router.route('/:id')
  .delete(protect, admin, deleteCategory);

module.exports = router;
