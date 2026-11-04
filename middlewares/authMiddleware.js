const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực token đăng nhập
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Người dùng không tồn tại' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có token, truy cập bị từ chối' });
  }
};

// Middleware xác thực tùy chọn: cho phép khách không đăng nhập,
// nhưng nếu client gửi token thì token bắt buộc phải hợp lệ.
const optionalProtect = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next();
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({
      success: false,
      message: 'Định dạng token không hợp lệ',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

// Middleware kiểm tra quyền Quản trị viên (Admin)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền thực hiện thao tác này' });
  }
};

module.exports = { protect, optionalProtect, admin };
