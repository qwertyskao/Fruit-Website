const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // 1. Tạo tài khoản mẫu
    console.log('🔄 Đang kiểm tra và tạo tài khoản...');
    
    // Xóa user cũ để tạo mới đồng bộ
    await User.deleteMany();

    const adminUser = await User.create({
      name: 'Quản trị viên (Admin)',
      email: 'admin@fruitables.com',
      password: 'admin123',
      role: 'admin',
      phone: '0988888888',
      address: 'Văn phòng Fruitables, Hà Nội',
    });

    const customerUser = await User.create({
      name: 'Nguyễn Văn Khách',
      email: 'khachhang@gmail.com',
      password: '123456',
      role: 'customer',
      phone: '0901234567',
      address: 'Số 123 Đường Cầu Giấy, Hà Nội',
    });

    console.log('✅ Đã tạo thành công tài khoản Admin và Khách hàng!');

    // 2. Tạo danh mục và sản phẩm mẫu (để tiện hiển thị và test)
    await Category.deleteMany();
    await Product.deleteMany();

    const catFruits = await Category.create({
      name: 'Trái cây tươi',
      description: 'Các loại hoa quả nhập khẩu và nội địa tươi ngon',
      image: '/fruitables-1.0.0/img/fruite-item-5.jpg',
    });

    const catVegetables = await Category.create({
      name: 'Rau củ hữu cơ',
      description: 'Rau xanh, củ quả sạch chuẩn VietGAP',
      image: '/fruitables-1.0.0/img/vegetable-item-2.jpg',
    });

    await Product.create([
      {
        name: 'Cam sành Hàm Yên',
        category: catFruits._id,
        price: 45000,
        discountPrice: 40000,
        description: 'Cam mọng nước, vị ngọt thanh tự nhiên, giàu Vitamin C.',
        unit: 'kg',
        countInStock: 50,
        rating: 5,
        isFeatured: true,
        images: ['/fruitables-1.0.0/img/fruite-item-1.jpg'],
      },
      {
        name: 'Nho đen không hạt Mỹ',
        category: catFruits._id,
        price: 150000,
        discountPrice: 135000,
        description: 'Nho đen giòn ngọt, vỏ mỏng, giàu chất chống oxy hóa.',
        unit: 'kg',
        countInStock: 30,
        rating: 5,
        isFeatured: true,
        images: ['/fruitables-1.0.0/img/fruite-item-5.jpg'],
      },
      {
        name: 'Dâu tây Đà Lạt chuẩn VietGAP',
        category: catFruits._id,
        price: 120000,
        discountPrice: 110000,
        description: 'Dâu tây đỏ mọng, thơm lừng ngọt dịu hái trực tiếp tại vườn.',
        unit: 'hộp 500g',
        countInStock: 25,
        rating: 5,
        isFeatured: true,
        images: ['/fruitables-1.0.0/img/fruite-item-2.jpg'],
      },
      {
        name: 'Táo đỏ Gala nhập khẩu New Zealand',
        category: catFruits._id,
        price: 85000,
        discountPrice: 75000,
        description: 'Táo Gala giòn ngọt, thơm đặc trưng, giàu chất xơ và vitamin.',
        unit: 'kg',
        countInStock: 35,
        rating: 5,
        isFeatured: true,
        images: ['/fruitables-1.0.0/img/fruite-item-4.jpg'],
      },
      {
        name: 'Bông cải xanh hữu cơ',
        category: catVegetables._id,
        price: 35000,
        discountPrice: 30000,
        description: 'Súp lơ xanh giòn ngọt, trồng theo tiêu chuẩn hữu cơ.',
        unit: 'kg',
        countInStock: 40,
        rating: 5,
        isFeatured: true,
        images: ['/fruitables-1.0.0/img/vegetable-item-2.jpg'],
      },
      {
        name: 'Ớt chuông Đà Lạt các màu',
        category: catVegetables._id,
        price: 55000,
        discountPrice: 48000,
        description: 'Ớt chuông đỏ vàng giòn ngọt, giàu vitamin A và khoáng chất.',
        unit: 'kg',
        countInStock: 30,
        rating: 5,
        isFeatured: true,
        images: ['/fruitables-1.0.0/img/vegetable-item-4.jpg'],
      },
      {
        name: 'Khoai tây hữu cơ Đà Lạt',
        category: catVegetables._id,
        price: 32000,
        discountPrice: 28000,
        description: 'Khoai tây vàng bùi thơm ngon, không tồn dư thuốc bảo vệ thực vật.',
        unit: 'kg',
        countInStock: 45,
        rating: 5,
        isFeatured: true,
        images: ['/fruitables-1.0.0/img/vegetable-item-5.jpg'],
      },
    ]);

    console.log('✅ Đã tạo sẵn một số danh mục và sản phẩm mẫu!');
    console.log('==================================================');
    console.log('📌 THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP:');
    console.log('👑 1. TÀI KHOẢN ADMIN (Quản trị):');
    console.log('   - Email:    admin@fruitables.com');
    console.log('   - Mật khẩu: admin123');
    console.log('   - Quyền:    admin');
    console.log('👤 2. TÀI KHOẢN KHÁCH HÀNG (Customer):');
    console.log('   - Email:    khachhang@gmail.com');
    console.log('   - Mật khẩu: 123456');
    console.log('   - Quyền:    customer');
    console.log('==================================================');

    process.exit();
  } catch (error) {
    console.error(`❌ Lỗi tạo dữ liệu mẫu: ${error.message}`);
    process.exit(1);
  }
};

seedData();
