# 🌿 Dự Án WebFruitables (Website Bán Hoa Quả & Nông Sản Sạch)

Dự án Back-End xây dựng bằng **Node.js, Express, MongoDB, JWT, Nodemailer, Bcrypt, Multer**.

---

## 📌 1. Thông Tin Tài Khoản Mặc Định

Nếu bạn quên tài khoản hoặc mật khẩu, bạn có thể xem lại tại đây hoặc trong file `seeder.js`:

| Vai trò | Email | Mật khẩu mặc định | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@fruitables.com` | `admin123` | `admin` (Toàn quyền quản trị) |
| **Khách hàng (Customer)** | `khachhang@gmail.com` | `123456` | `customer` (Mua hàng) |

> ⚠️ **Lưu ý về mật khẩu trong MongoDB:** Trong cơ sở dữ liệu MongoDB, mật khẩu đã được mã hóa một chiều bằng thuật toán **Bcrypt** (chuỗi ký tự như `$2a$10$...`) nên bạn không thể đọc mật khẩu gốc trực tiếp từ MongoDB.  
> Nếu bạn thay đổi mật khẩu mà bị quên, chỉ cần chạy lệnh sau để đặt lại mật khẩu về mặc định:
> ```bash
> npm run seed
> ```

---

## 🚀 2. Hướng Dẫn Chạy Dự Án

### Bước 1: Khởi động Server
```bash
npm run dev
```

### Bước 2: Các đường dẫn truy cập (Port mặc định: 5000)
* **Giao diện Khách hàng (Fruitables):** [http://localhost:5000/client/index.html](http://localhost:5000/client/index.html)
* **Giao diện Đăng nhập Admin:** [http://localhost:5000/admin/page-login.html](http://localhost:5000/admin/page-login.html)
* **Bảng điều khiển Admin (Dashboard):** [http://localhost:5000/admin/index.html](http://localhost:5000/admin/index.html)
* **API Kiểm tra trạng thái:** [http://localhost:5000](http://localhost:5000)

---

## 📁 3. Cấu Trúc Thư Mục

* `config/`: Kết nối cơ sở dữ liệu MongoDB (`db.js`)
* `models/`: Định nghĩa các bảng dữ liệu (`User`, `Product`, `Category`, `Order`)
* `controllers/`: Xử lý logic nghiệp vụ cho từng chức năng
* `routes/`: Định tuyến các đường dẫn API (`/api/auth`, `/api/products`, `/api/orders`, `/api/categories`)
* `middlewares/`: Xác thực token JWT, phân quyền Admin, upload ảnh (Multer), xử lý lỗi
* `utils/`: Gửi email xác nhận đơn hàng qua Nodemailer (`sendMail.js`)
* `fruitables-1.0.0/`: Giao diện Front-end cho khách hàng mua hàng (đã Việt hóa)
* `spark-admin-1.0.0/`: Giao diện Front-end cho ban quản trị (đã Việt hóa)
* `uploads/`: Thư mục lưu trữ hình ảnh sản phẩm được tải lên
* `seeder.js`: File tạo dữ liệu và tài khoản mẫu ban đầu
