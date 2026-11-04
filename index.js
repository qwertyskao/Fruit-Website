const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Nạp cấu hình từ .env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// Cấu hình Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cung cấp thư mục tĩnh cho hình ảnh đã upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cung cấp tĩnh 2 giao diện Front-end để tiện xem và tích hợp (hỗ trợ cả alias /fruitables-1.0.0 và /spark-admin-1.0.0)
app.use('/client', express.static(path.join(__dirname, 'fruitables-1.0.0')));
app.use('/fruitables-1.0.0', express.static(path.join(__dirname, 'fruitables-1.0.0')));
app.use('/admin', express.static(path.join(__dirname, 'spark-admin-1.0.0')));
app.use('/spark-admin-1.0.0', express.static(path.join(__dirname, 'spark-admin-1.0.0')));

// Khi truy cập http://localhost:5000 -> Tự động chuyển hướng vào Trang chủ Giao diện
app.get('/', (req, res) => {
  res.redirect('/client/index.html');
});

// Đường dẫn nhanh tới trang Đăng nhập Khách hàng & Quản trị
app.get('/login', (req, res) => {
  res.redirect('/client/login.html');
});
app.get('/admin/login', (req, res) => {
  res.redirect('/admin/page-login.html');
});

// Route kiểm tra trạng thái API dành cho lập trình viên (http://localhost:5000/api)
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 Fruitables Backend API đang chạy bình thường!',
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
      products: '/api/products',
      orders: '/api/orders',
    },
    frontends: {
      client: '/client/index.html',
      admin: '/admin/index.html',
    },
  });
});

// Khai báo các Routes API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Xử lý lỗi (Error handling middlewares)
app.use(notFound);
app.use(errorHandler);

// Lắng nghe cổng khởi chạy
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Server đang chạy trên cổng: http://localhost:${PORT}`);
  console.log(`🛒 Xem Giao diện Khách hàng: http://localhost:${PORT}/client/index.html`);
  console.log(`⚙️  Xem Giao diện Admin:     http://localhost:${PORT}/admin/index.html`);
  console.log(`===============================================`);
});
