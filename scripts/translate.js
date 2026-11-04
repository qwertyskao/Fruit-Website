const fs = require('fs');
const path = require('path');

const fruitablesDir = path.join(__dirname, '..', 'fruitables-1.0.0');
const sparkAdminDir = path.join(__dirname, '..', 'spark-admin-1.0.0');

// Bảng thay thế cho Fruitables
const fruitablesReplacements = [
  // Cấu hình ngôn ngữ
  [/<html lang="en">/g, '<html lang="vi">'],
  
  // Menu điều hướng & Tiêu đề trang
  [/>Home<\/a>/g, '>Trang chủ</a>'],
  [/>Home<\/li>/g, '>Trang chủ</li>'],
  [/>Shop<\/a>/g, '>Cửa hàng</a>'],
  [/>Shop<\/h1>/g, '>Cửa hàng</h1>'],
  [/>Shop<\/li>/g, '>Cửa hàng</li>'],
  [/>Shop Detail<\/a>/g, '>Chi tiết sản phẩm</a>'],
  [/>Shop Detail<\/h1>/g, '>Chi tiết sản phẩm</h1>'],
  [/>Shop Detail<\/li>/g, '>Chi tiết sản phẩm</li>'],
  [/>Pages<\/a>/g, '>Trang</a>'],
  [/>Cart<\/a>/g, '>Giỏ hàng</a>'],
  [/>Cart<\/h1>/g, '>Giỏ hàng</h1>'],
  [/>Cart<\/li>/g, '>Giỏ hàng</li>'],
  [/>Chackout<\/a>/g, '>Thanh toán</a>'],
  [/>Checkout<\/a>/g, '>Thanh toán</a>'],
  [/>Checkout<\/h1>/g, '>Thanh toán</h1>'],
  [/>Checkout<\/li>/g, '>Thanh toán</li>'],
  [/>Testimonial<\/a>/g, '>Đánh giá</a>'],
  [/>Testimonial<\/h1>/g, '>Đánh giá</h1>'],
  [/>Testimonial<\/li>/g, '>Đánh giá</li>'],
  [/>404 Page<\/a>/g, '>Trang 404</a>'],
  [/>404 Page<\/h1>/g, '>Trang 404</h1>'],
  [/>404 Page<\/li>/g, '>Trang 404</li>'],
  [/>Contact<\/a>/g, '>Liên hệ</a>'],
  [/>Contact<\/h1>/g, '>Liên hệ</h1>'],
  [/>Contact<\/li>/g, '>Liên hệ</li>'],

  // Tìm kiếm
  [/Search by keyword/g, 'Tìm kiếm theo từ khóa'],
  [/placeholder="keywords"/g, 'placeholder="Nhập từ khóa tìm kiếm..."'],
  [/placeholder="Search"/g, 'placeholder="Tìm kiếm sản phẩm..."'],
  [/>Submit Now<\/button>/g, '>Tìm kiếm ngay</button>'],
  [/>Submit<\/button>/g, '>Gửi ngay</button>'],

  // Topbar
  [/Privacy Policy/g, 'Chính sách bảo mật'],
  [/Terms of Use/g, 'Điều khoản sử dụng'],
  [/Sales and Refunds/g, 'Chính sách đổi trả'],

  // Hero Section
  [/100% Organic Foods/g, '100% Nông sản hữu cơ sạch'],
  [/Organic Veggies & Fruits Foods/g, 'Rau củ & Trái cây tươi ngon tự nhiên'],
  [/>Fruites<\/a>/g, '>Trái cây</a>'],
  [/>Vesitables<\/a>/g, '>Rau củ</a>'],

  // Features
  [/Free Shipping/g, 'Miễn phí vận chuyển'],
  [/Free on order over \$300/g, 'Miễn phí cho đơn từ 300.000đ'],
  [/Security Payment/g, 'Thanh toán bảo mật'],
  [/100% security payment/g, 'An toàn & Bảo mật 100%'],
  [/30 Day Return/g, 'Đổi trả trong 30 ngày'],
  [/30 day money guarantee/g, 'Cam kết hoàn tiền trong 30 ngày'],
  [/24\/7 Support/g, 'Hỗ trợ khách hàng 24/7'],
  [/Support every time fast/g, 'Phản hồi nhanh chóng, tận tình'],

  // Categories / Tabs
  [/Our Organic Products/g, 'Sản phẩm hữu cơ của chúng tôi'],
  [/All Products/g, 'Tất cả sản phẩm'],
  [/>Vegetables<\/a>/g, '>Rau củ tươi</a>'],
  [/>Fruits<\/a>/g, '>Trái cây tươi</a>'],
  [/>Bread<\/a>/g, '>Bánh mì</a>'],
  [/>Meat<\/a>/g, '>Thịt tươi sạch</a>'],
  [/Categories/g, 'Danh mục sản phẩm'],

  // Product cards & Actions
  [/Add to cart/g, 'Thêm vào giỏ'],
  [/Buy Now/g, 'Mua ngay'],
  [/Fresh Organic Vegetables/g, 'Rau củ hữu cơ tươi ngon'],
  [/Fresh Fruits/g, 'Trái cây tươi sạch'],
  [/in Our Store/g, 'tại Cửa hàng Fruitables'],
  [/Bestseller Products/g, 'Sản phẩm bán chạy nhất'],

  // Counter
  [/Satisfied Customers/g, 'Khách hàng hài lòng'],
  [/Quality of Service/g, 'Chất lượng phục vụ'],
  [/Quality Certificates/g, 'Chứng nhận chất lượng'],
  [/Available Products/g, 'Sản phẩm đa dạng'],

  // Testimonials & Footer
  [/Our Clients Saying!/g, 'Khách hàng nói gì về chúng tôi!'],
  [/Why People Like us!/g, 'Về Fruitables'],
  [/Shop Info/g, 'Thông tin cửa hàng'],
  [/About Us/g, 'Giới thiệu'],
  [/Contact Us/g, 'Liên hệ'],
  [/Account/g, 'Tài khoản'],
  [/My Account/g, 'Tài khoản của tôi'],
  [/Order History/g, 'Lịch sử đơn hàng'],
  [/Shopping Cart/g, 'Giỏ hàng'],
  [/Wishlist/g, 'Yêu thích'],
  [/Subscribe Now/g, 'Đăng ký nhận tin'],
  [/Payment Accepted/g, 'Phương thức thanh toán'],
  [/Address:/g, 'Địa chỉ:'],
  [/Telephone/g, 'Điện thoại'],

  // Cart & Checkout
  [/>Products<\/th>/g, '>Sản phẩm</th>'],
  [/>Name<\/th>/g, '>Tên sản phẩm</th>'],
  [/>Price<\/th>/g, '>Đơn giá</th>'],
  [/>Quantity<\/th>/g, '>Số lượng</th>'],
  [/>Total<\/th>/g, '>Thành tiền</th>'],
  [/>Handle<\/th>/g, '>Xóa</th>'],
  [/placeholder="Coupon Code"/g, 'placeholder="Mã giảm giá..."'],
  [/Apply Coupon/g, 'Áp dụng mã'],
  [/Cart <span class="fw-normal">Total<\/span>/g, 'Tổng cộng <span class="fw-normal">Giỏ hàng</span>'],
  [/Subtotal:/g, 'Tạm tính:'],
  [/>Subtotal<\/p>/g, '>Tạm tính</p>'],
  [/>Shipping<\/h5>/g, '>Vận chuyển</h5>'],
  [/Flat rate:/g, 'Phí cố định:'],
  [/Proceed Checkout/g, 'Tiến hành thanh toán'],
  [/Billing details/g, 'Thông tin thanh toán & Giao hàng'],
  [/First Name/g, 'Họ'],
  [/Last Name/g, 'Tên'],
  [/Company Name/g, 'Tên công ty (nếu có)'],
  [/placeholder="House Number Street Name"/g, 'placeholder="Số nhà, tên đường, phường/xã..."'],
  [/Town\/City/g, 'Tỉnh / Thành phố'],
  [/Country/g, 'Quốc gia'],
  [/Postcode\/Zip/g, 'Mã bưu điện'],
  [/Mobile/g, 'Số điện thoại'],
  [/Email Address/g, 'Địa chỉ Email'],
  [/Create an account\?/g, 'Tạo tài khoản mới?'],
  [/Ship to a different address\?/g, 'Giao hàng đến địa chỉ khác?'],
  [/placeholder="Oreder Notes \(Optional\)"/g, 'placeholder="Ghi chú đơn hàng (Tùy chọn)..."'],
  [/Place Order/g, 'Xác nhận Đặt hàng'],
  [/Direct Bank Transfer/g, 'Chuyển khoản ngân hàng trực tiếp'],
  [/Check Payments/g, 'Thanh toán thẻ'],
  [/Cash On Delivery/g, 'Thanh toán khi nhận hàng (COD)'],

  // Shop page specific
  [/Fresh fruits shop/g, 'Cửa hàng nông sản & trái cây sạch'],
  [/Default Sorting:/g, 'Sắp xếp theo:'],
  [/>Nothing<\/option>/g, '>Mặc định</option>'],
  [/>Popularity<\/option>/g, '>Phổ biến nhất</option>'],
  [/>Organic<\/option>/g, '>Hữu cơ sạch</option>'],
  [/>Fantastic<\/option>/g, '>Đánh giá cao</option>'],
  [/>Apples</g, '>Táo tây<'],
  [/>Oranges</g, '>Cam sành<'],
  [/>Strawbery</g, '>Dâu tây<'],
  [/>Banana</g, '>Chuối tiêu<'],
  [/>Pumpkin</g, '>Bí ngô<'],
  [/>Price<\/h4>/g, '>Mức giá</h4>'],
  [/>Additional<\/h4>/g, '>Tiêu chuẩn</h4>'],
  [/> Organic<\/label>/g, '> Hữu cơ</label>'],
  [/> Fresh<\/label>/g, '> Tươi mới</label>'],

  // Shop detail
  [/Category:/g, 'Danh mục:'],
  [/>Description<\/button>/g, '>Mô tả sản phẩm</button>'],
  [/>Reviews<\/button>/g, '>Đánh giá của khách</button>'],
  [/>Weight<\/p>/g, '>Trọng lượng</p>'],
  [/>Country of Origin<\/p>/g, '>Xuất xứ</p>'],
  [/>Quality<\/p>/g, '>Chất lượng</p>'],
  [/>Сheck<\/p>/g, '>Tiêu chuẩn</p>'],
  [/>Healthy<\/p>/g, '>An toàn sức khỏe</p>'],

  // Contact page
  [/Get in touch/g, 'Liên hệ với chúng tôi'],
  [/placeholder="Your Name"/g, 'placeholder="Họ và tên của bạn..."'],
  [/placeholder="Enter Your Email"/g, 'placeholder="Nhập địa chỉ Email..."'],
  [/placeholder="Your Message"/g, 'placeholder="Nội dung tin nhắn cần liên hệ..."'],
  [/>Address<\/h4>/g, '>Địa chỉ</h4>'],
  [/>Mail Us<\/h4>/g, '>Gửi Email</h4>'],
  [/>Telephone<\/h4>/g, '>Điện thoại</h4>'],
];

// Bảng thay thế cho Spark Admin
const sparkAdminReplacements = [
  [/<html lang="en">/g, '<html lang="vi">'],
  [/Login Screen - Spark Admin Premium/g, 'Đăng nhập Quản trị - Spark Admin'],
  [/Spark Admin - Premium Bootstrap 5 Admin Dashboard Template/g, 'Spark Admin - Bảng điều khiển Quản trị viên'],
  [/Please sign in to access your dashboard/g, 'Vui lòng đăng nhập để truy cập bảng điều khiển'],
  [/<label for="email" class="login-form-label">Email Address<\/label>/g, '<label for="email" class="login-form-label">Địa chỉ Email</label>'],
  [/<label for="password" class="login-form-label">Password<\/label>/g, '<label for="password" class="login-form-label">Mật khẩu</label>'],
  [/<span>Remember Me<\/span>/g, '<span>Ghi nhớ đăng nhập</span>'],
  [/Forgot Password\?/g, 'Quên mật khẩu?'],
  [/<span>Sign In to Dashboard<\/span>/g, '<span>Đăng nhập vào Quản trị</span>'],
  [/Or sign in with/g, 'Hoặc đăng nhập với'],
  [/Don't have an account\? <a href="#" id="link-register">Register Now<\/a>/g, 'Chưa có tài khoản? <a href="#" id="link-register">Đăng ký ngay</a>'],

  // Sidebar Spark Admin
  [/>Menu<\/div>/g, '>Danh mục</div>'],
  [/>Components<\/div>/g, '>Giao diện & Thành phần</div>'],
  [/>Pages<\/div>/g, '>Trang</div>'],
  [/<span>Dashboard<\/span>/g, '<span>Bảng điều khiển</span>'],
  [/<span>Basic Tables<\/span>/g, '<span>Quản lý dữ liệu</span>'],
  [/<span>Forms & Input<\/span>/g, '<span>Biểu mẫu & Nhập liệu</span>'],
  [/<span>Buttons & Alerts<\/span>/g, '<span>Nút bấm & Thông báo</span>'],
  [/<span>Blank Page<\/span>/g, '<span>Trang mẫu trống</span>'],
  [/<span>Login Screen<\/span>/g, '<span>Màn hình Đăng nhập</span>'],
  [/<span>Error 404<\/span>/g, '<span>Lỗi 404</span>'],

  // Dashboard contents
  [/placeholder="Search anything in Spark\.\.\."/g, 'placeholder="Tìm kiếm trong hệ thống..."'],
  [/<span>Create<\/span>/g, '<span>Tạo mới</span>'],
  [/New Invoice/g, 'Hóa đơn mới'],
  [/New User/g, 'Người dùng mới'],
  [/New Product/g, 'Sản phẩm mới'],
  [/System Settings/g, 'Cài đặt hệ thống'],
  [/Notifications/g, 'Thông báo'],
  [/Mark all read/g, 'Đánh dấu đã đọc'],
  [/Total Revenue/g, 'Tổng doanh thu'],
  [/Total Orders/g, 'Tổng đơn hàng'],
  [/Total Products/g, 'Tổng sản phẩm'],
  [/Total Users/g, 'Khách hàng'],
  [/Recent Orders/g, 'Đơn hàng gần đây'],
  [/View All/g, 'Xem tất cả'],
  [/>Status<\/th>/g, '>Trạng thái</th>'],
  [/>Action<\/th>/g, '>Thao tác</th>'],
  [/>Customer<\/th>/g, '>Khách hàng</th>'],
  [/>Date<\/th>/g, '>Ngày tạo</th>'],
  [/>Amount<\/th>/g, '>Số tiền</th>'],
  [/Profile/g, 'Hồ sơ'],
  [/Logout/g, 'Đăng xuất'],
];

function processDirectory(dir, replacements) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Bỏ qua thư mục lib và assets để không làm hỏng code thư viện bên thứ 3
      if (file !== 'lib' && file !== 'libs' && file !== 'node_modules') {
        processDirectory(fullPath, replacements);
      }
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Đảm bảo có <meta charset="utf-8">
      if (!content.includes('charset="utf-8"') && !content.includes('charset="UTF-8"')) {
        content = content.replace('<head>', '<head>\n    <meta charset="utf-8">');
      }

      for (const [pattern, replacement] of replacements) {
        content = content.replace(pattern, replacement);
      }

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Đã Việt hóa: ${file}`);
    }
  }
}

console.log('🚀 Bắt đầu Việt hóa giao diện Fruitables...');
processDirectory(fruitablesDir, fruitablesReplacements);

console.log('🚀 Bắt đầu Việt hóa giao diện Spark Admin...');
processDirectory(sparkAdminDir, sparkAdminReplacements);

console.log('🎉 Hoàn thành Việt hóa toàn bộ giao diện!');
