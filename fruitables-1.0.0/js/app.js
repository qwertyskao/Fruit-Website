/**
 * Fruitables E-Commerce Client Application Engine
 * Kết nối Front-end Fruitables với Back-end Node.js & MongoDB
 */

// Ngay lập tức áp dụng theme đã lưu để tránh giật giao diện (Avoid FOUC)
(function () {
  try {
    const saved = localStorage.getItem('fruitables_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark-mode');
      if (document.body) document.body.classList.add('dark-mode');
    }
  } catch (e) {}
})();

const API_BASE = window.location.origin + '/api';

const app = {
  // ==========================================
  // 0.1 QUẢN LÝ GIAO DIỆN SÁNG / TỐI (Dark/Light Theme)
  // ==========================================
  initTheme() {
    const savedTheme = localStorage.getItem('fruitables_theme') || 'light';
    this.applyTheme(savedTheme);

    // Bắt sự kiện click trên các nút đổi theme
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-theme-toggle, #btn-theme-toggle');
      if (btn) {
        e.preventDefault();
        const isDark =
          document.body.classList.contains('dark-mode') ||
          document.documentElement.classList.contains('dark-mode');
        const nextTheme = isDark ? 'light' : 'dark';
        this.applyTheme(nextTheme);
        this.showToast(
          nextTheme === 'dark' ? '🌙 Đã chuyển sang giao diện Tối' : '☀️ Đã chuyển sang giao diện Sáng'
        );
      }
    });

    // Tự động kiểm tra và chèn nút nếu trang chưa có sẵn trong HTML
    this.ensureThemeToggleInNavbar();
  },

  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      if (document.body) document.body.classList.add('dark-mode');
      localStorage.setItem('fruitables_theme', 'dark');
      this.updateThemeIcons('dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      if (document.body) document.body.classList.remove('dark-mode');
      localStorage.setItem('fruitables_theme', 'light');
      this.updateThemeIcons('light');
    }
  },

  updateThemeIcons(theme) {
    document.querySelectorAll('.btn-theme-toggle, #btn-theme-toggle').forEach((btn) => {
      if (theme === 'dark') {
        btn.innerHTML = '<i class="fas fa-sun text-warning"></i>';
        btn.setAttribute('title', 'Chuyển sang giao diện Sáng');
        btn.setAttribute('aria-label', 'Chuyển sang giao diện Sáng');
      } else {
        btn.innerHTML = '<i class="fas fa-moon text-primary"></i>';
        btn.setAttribute('title', 'Chuyển sang giao diện Tối');
        btn.setAttribute('aria-label', 'Chuyển sang giao diện Tối');
      }
    });
  },

  ensureThemeToggleInNavbar() {
    const actionContainers = document.querySelectorAll('.navbar .d-flex.m-3.me-0');
    actionContainers.forEach((container) => {
      if (!container.querySelector('.btn-theme-toggle, #btn-theme-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className =
          'btn border border-secondary btn-md-square rounded-circle bg-white me-4 my-auto btn-theme-toggle';
        toggleBtn.id = 'btn-theme-toggle';
        const isDark =
          document.documentElement.classList.contains('dark-mode') ||
          (document.body && document.body.classList.contains('dark-mode'));
        toggleBtn.innerHTML = isDark
          ? '<i class="fas fa-sun text-warning"></i>'
          : '<i class="fas fa-moon text-primary"></i>';
        toggleBtn.title = isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối';
        toggleBtn.setAttribute('aria-label', toggleBtn.title);

        const cartBtn = container.querySelector('a[href*="cart.html"]');
        if (cartBtn) {
          container.insertBefore(toggleBtn, cartBtn);
        } else {
          container.appendChild(toggleBtn);
        }
      }
    });
  },

  // ==========================================
  // 0. CHUẨN HÓA ĐƯỜNG DẪN ẢNH (Image Helper)
  // ==========================================
  formatImageUrl(imgSrc) {
    if (!imgSrc || typeof imgSrc !== 'string' || imgSrc.trim() === '') {
      return 'img/fruite-item-5.jpg';
    }
    imgSrc = imgSrc.trim();
    if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
      return imgSrc;
    }
    if (imgSrc.startsWith('/uploads/')) {
      return imgSrc;
    }
    if (imgSrc.startsWith('uploads/')) {
      return '/' + imgSrc;
    }
    if (imgSrc.includes('/img/')) {
      return 'img/' + imgSrc.substring(imgSrc.indexOf('/img/') + 5);
    }
    if (imgSrc.startsWith('img/')) {
      return imgSrc;
    }
    return imgSrc;
  },

  // ==========================================
  // 1. QUẢN LÝ GIỎ HÀNG (Cart System)
  // ==========================================
  getCart() {
    try {
      const cart = localStorage.getItem('fruitables_cart');
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem('fruitables_cart', JSON.stringify(cart));
    this.updateCartBadge();
  },

  addToCart(product, qty = 1) {
    let cart = this.getCart();
    const existingIndex = cart.findIndex((item) => item.product === product._id);

    if (existingIndex > -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        product: product._id,
        name: product.name,
        price: product.discountPrice > 0 ? product.discountPrice : product.price,
        image: this.formatImageUrl(product.images && product.images[0]),
        unit: product.unit || 'kg',
        qty: qty,
      });
    }

    this.saveCart(cart);
    this.showToast(`✅ Đã thêm "${product.name}" vào giỏ hàng!`);
  },

  async addToCartById(productId, qty = 1) {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`);
      const json = await res.json();
      if (json.success && json.data) {
        this.addToCart(json.data, qty);
      } else {
        this.showToast('❌ Không tìm thấy thông tin sản phẩm', 'error');
      }
    } catch (e) {
      console.error(e);
      this.showToast('❌ Lỗi kết nối máy chủ', 'error');
    }
  },

  updateCartQty(productId, newQty) {
    let cart = this.getCart();
    if (newQty <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const item = cart.find((i) => i.product === productId);
    if (item) {
      item.qty = newQty;
      this.saveCart(cart);
      this.renderCartPage();
    }
  },

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter((i) => i.product !== productId);
    this.saveCart(cart);
    this.renderCartPage();
    this.showToast('🗑️ Đã xóa sản phẩm khỏi giỏ hàng!');
  },

  clearCart() {
    localStorage.removeItem('fruitables_cart');
    this.updateCartBadge();
  },

  updateCartBadge() {
    const cart = this.getCart();
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.cart-badge').forEach((el) => {
      el.textContent = totalCount;
    });
  },

  getCartTotals() {
    const cart = this.getCart();
    const itemsPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shippingPrice = itemsPrice >= 300000 || itemsPrice === 0 ? 0 : 30000;
    const totalPrice = itemsPrice + shippingPrice;
    return { itemsPrice, shippingPrice, totalPrice };
  },

  // ==========================================
  // 2. THÔNG BÁO NỔI (Toast Notification)
  // ==========================================
  showToast(message, type = 'success') {
    let toastContainer = document.getElementById('fruitables-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'fruitables-toast-container';
      toastContainer.style.cssText =
        'position: fixed; top: 90px; right: 25px; z-index: 99999; display: flex; flex-direction: column; gap: 10px;';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'error' ? '#dc3545' : '#81c408';
    toast.style.cssText = `background: ${bgColor}; color: white; padding: 14px 22px; border-radius: 30px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); font-weight: 600; font-size: 14px; animation: slideIn 0.3s ease; display: flex; align-items: center; gap: 10px;`;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  },

  // ==========================================
  // 3. TẢI VÀ HIỂN THỊ SẢN PHẨM TỪ MONGODB
  // ==========================================
  async loadProducts(categoryId = '', keyword = '') {
    const container = document.getElementById('dynamic-products-container');
    if (!container) return;

    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Đang tải sản phẩm từ máy chủ...</p>
      </div>
    `;

    try {
      let url = `${API_BASE}/products`;
      const params = new URLSearchParams();
      if (categoryId) params.append('category', categoryId);
      if (keyword) params.append('keyword', keyword);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!json.success || !json.data || json.data.length === 0) {
        container.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Chưa có sản phẩm nào phù hợp</h5>
          </div>
        `;
        return;
      }

      const productsHtml = json.data
        .map((p) => {
          const image = app.formatImageUrl(p.images && p.images[0]);
          const categoryName = p.category ? p.category.name : 'Nông sản';
          const priceDisplay = p.discountPrice > 0
            ? `<span class="text-primary fs-5 fw-bold">${p.discountPrice.toLocaleString('vi-VN')} đ</span>
               <span class="text-muted text-decoration-line-through fs-6 ms-1">${p.price.toLocaleString('vi-VN')} đ</span>`
            : `<span class="text-primary fs-5 fw-bold">${p.price.toLocaleString('vi-VN')} đ</span>`;

          return `
            <div class="col-md-6 col-lg-4 col-xl-3">
              <div class="rounded position-relative fruite-item border border-secondary border-top-0 shadow-sm h-100 d-flex flex-column justify-content-between" style="overflow: hidden; background: #fff;">
                <div class="fruite-img position-relative" style="height: 220px; overflow: hidden;">
                  <img src="${image}" onerror="this.onerror=null; this.src='img/fruite-item-5.jpg';" class="img-fluid w-100 h-100 object-fit-cover" alt="${p.name}" style="transition: transform 0.3s ease;">
                  <span class="text-white bg-secondary px-3 py-1 rounded position-absolute" style="top: 10px; left: 10px; font-size: 13px;">
                    ${categoryName}
                  </span>
                </div>
                <div class="p-4 d-flex flex-column flex-grow-1 justify-content-between">
                  <div>
                    <h5 class="fw-bold mb-2 text-dark">${p.name}</h5>
                    <p class="text-muted small mb-3" style="min-height: 40px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${p.description || 'Nông sản tươi sạch được tuyển chọn chuẩn VietGAP.'}
                    </p>
                  </div>
                  <div>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <div>${priceDisplay} <small class="text-muted">/ ${p.unit || 'kg'}</small></div>
                      <span class="badge bg-light text-dark border">Kho: ${p.countInStock}</span>
                    </div>
                    <button onclick="app.addToCartById('${p._id}')" class="btn border border-secondary rounded-pill px-3 text-primary w-100 btn-add-cart">
                      <i class="fa fa-shopping-bag me-2 text-primary"></i> Thêm vào giỏ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      container.innerHTML = productsHtml;
    } catch (e) {
      console.error(e);
      container.innerHTML = `<div class="col-12 text-center text-danger py-4">Lỗi kết nối máy chủ backend.</div>`;
    }
  },

  // ==========================================
  // 4. HIỂN THỊ TRANG GIỎ HÀNG (Cart Page)
  // ==========================================
  renderCartPage() {
    const cartTbody = document.getElementById('cart-table-body');
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');

    if (!cartTbody) return;

    const cart = this.getCart();

    if (cart.length === 0) {
      cartTbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-5">
            <i class="fa fa-shopping-cart fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Giỏ hàng của bạn đang trống!</h5>
            <a href="index.html" class="btn btn-primary rounded-pill px-4 py-2 text-white mt-3">Tiếp tục mua sắm</a>
          </td>
        </tr>
      `;
      if (subtotalEl) subtotalEl.textContent = '0 đ';
      if (shippingEl) shippingEl.textContent = '0 đ';
      if (totalEl) totalEl.textContent = '0 đ';
      return;
    }

    const { itemsPrice, shippingPrice, totalPrice } = this.getCartTotals();

    cartTbody.innerHTML = cart
      .map(
        (item) => `
        <tr>
          <th scope="row">
            <div class="d-flex align-items-center">
              <img src="${app.formatImageUrl(item.image)}" onerror="this.onerror=null; this.src='img/fruite-item-5.jpg';" class="img-fluid rounded-circle" style="width: 70px; height: 70px; object-fit: cover;" alt="${item.name}">
            </div>
          </th>
          <td>
            <p class="mb-0 mt-4 fw-bold text-dark">${item.name}</p>
          </td>
          <td>
            <p class="mb-0 mt-4 text-primary fw-bold">${item.price.toLocaleString('vi-VN')} đ</p>
          </td>
          <td>
            <div class="input-group quantity mt-4" style="width: 110px;">
              <button onclick="app.updateCartQty('${item.product}', ${item.qty - 1})" class="btn btn-sm btn-minus rounded-circle bg-light border">
                <i class="fa fa-minus"></i>
              </button>
              <input type="text" class="form-control form-control-sm text-center border-0 bg-transparent fw-bold" value="${item.qty}" readonly>
              <button onclick="app.updateCartQty('${item.product}', ${item.qty + 1})" class="btn btn-sm btn-plus rounded-circle bg-light border">
                <i class="fa fa-plus"></i>
              </button>
            </div>
          </td>
          <td>
            <p class="mb-0 mt-4 text-dark fw-bold">${(item.price * item.qty).toLocaleString('vi-VN')} đ</p>
          </td>
          <td>
            <button onclick="app.removeFromCart('${item.product}')" class="btn btn-md rounded-circle bg-light border mt-4 text-danger" title="Xóa">
              <i class="fa fa-times"></i>
            </button>
          </td>
        </tr>
      `
      )
      .join('');

    if (subtotalEl) subtotalEl.textContent = `${itemsPrice.toLocaleString('vi-VN')} đ`;
    if (shippingEl) shippingEl.textContent = shippingPrice === 0 ? 'Miễn phí' : `${shippingPrice.toLocaleString('vi-VN')} đ`;
    if (totalEl) totalEl.textContent = `${totalPrice.toLocaleString('vi-VN')} đ`;
  },

  // ==========================================
  // 5. HIỂN THỊ VÀ XỬ LÝ TRANG THANH TOÁN (Checkout)
  // ==========================================
  renderCheckoutPage() {
    const summaryTbody = document.getElementById('checkout-items-summary');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');
    const checkoutForm = document.getElementById('checkout-form');

    if (!summaryTbody || !checkoutForm) return;

    const cart = this.getCart();
    if (cart.length === 0) {
      summaryTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Giỏ hàng trống!</td></tr>`;
      return;
    }

    const { itemsPrice, shippingPrice, totalPrice } = this.getCartTotals();

    summaryTbody.innerHTML = cart
      .map(
        (item) => `
        <tr>
          <th scope="row">
            <img src="${app.formatImageUrl(item.image)}" onerror="this.onerror=null; this.src='img/fruite-item-5.jpg';" class="img-fluid rounded-circle" style="width: 50px; height: 50px; object-fit: cover;" alt="">
          </th>
          <td class="py-3">${item.name}</td>
          <td class="py-3 text-center">x ${item.qty}</td>
          <td class="py-3 text-end fw-bold">${(item.price * item.qty).toLocaleString('vi-VN')} đ</td>
        </tr>
      `
      )
      .join('');

    if (subtotalEl) subtotalEl.textContent = `${itemsPrice.toLocaleString('vi-VN')} đ`;
    if (shippingEl) shippingEl.textContent = shippingPrice === 0 ? 'Miễn phí' : `${shippingPrice.toLocaleString('vi-VN')} đ`;
    if (totalEl) totalEl.textContent = `${totalPrice.toLocaleString('vi-VN')} đ`;

    // Tự động điền nếu đã đăng nhập
    const customer = this.getCustomerInfo();
    if (customer) {
      if (document.getElementById('c-name')) document.getElementById('c-name').value = customer.name || '';
      if (document.getElementById('c-email')) document.getElementById('c-email').value = customer.email || '';
      if (document.getElementById('c-phone')) document.getElementById('c-phone').value = customer.phone || '';
      if (document.getElementById('c-address')) document.getElementById('c-address').value = customer.address || '';
    }

    // Xử lý gửi đơn hàng
    checkoutForm.onsubmit = async (e) => {
      e.preventDefault();

      if (cart.length === 0) {
        alert('Giỏ hàng trống, vui lòng chọn sản phẩm trước khi đặt hàng!');
        return;
      }

      const fullName = document.getElementById('c-name').value.trim();
      const phone = document.getElementById('c-phone').value.trim();
      const email = document.getElementById('c-email').value.trim();
      const address = document.getElementById('c-address').value.trim();
      const city = (document.getElementById('c-city') && document.getElementById('c-city').value.trim()) || '';
      const note = (document.getElementById('c-note') && document.getElementById('c-note').value.trim()) || '';
      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')
        ? document.querySelector('input[name="paymentMethod"]:checked').value
        : 'COD';

      if (!fullName || !phone || !address || !email) {
        alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại, Email và Địa chỉ nhận hàng!');
        return;
      }

      const orderPayload = {
        // Chỉ gửi ID sản phẩm và số lượng. Giá/tổng tiền do Backend tự tính.
        orderItems: cart.map((item) => ({
          product: item.product,
          qty: Number(item.qty),
        })),
        shippingAddress: { fullName, phone, email, address, city, note },
        paymentMethod: paymentMethod === 'Banking' ? 'Banking' : 'COD',
      };

      const btnSubmit = document.getElementById('btn-place-order');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Đang tạo đơn hàng...`;
      }

      try {
        const token = this.getCustomerToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(orderPayload),
        });

        const json = await res.json();
        if (json.success && json.data) {
          app.clearCart();
          alert(`🎉 ĐẶT HÀNG THÀNH CÔNG!\n\nMã đơn hàng của bạn: #${json.data._id}\nTổng thanh toán: ${json.data.totalPrice.toLocaleString('vi-VN')} đ\n\nEmail xác nhận chi tiết đã được gửi tới: ${email}`);
          window.location.href = 'index.html';
        } else {
          alert('❌ Có lỗi xảy ra khi tạo đơn hàng: ' + (json.message || 'Vui lòng thử lại'));
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `Xác nhận Đặt hàng`;
          }
        }
      } catch (err) {
        console.error(err);
        alert('❌ Lỗi kết nối máy chủ khi tạo đơn hàng!');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `Xác nhận Đặt hàng`;
        }
      }
    };
  },

  // ==========================================
  // 6. XÁC THỰC NGƯỜI DÙNG & QUẢN TRỊ VIÊN (Auth)
  // ==========================================
  getCustomerToken() {
    return localStorage.getItem('customerToken') || localStorage.getItem('adminToken');
  },

  getCustomerInfo() {
    try {
      const user = localStorage.getItem('customerUser') || localStorage.getItem('adminUser');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  customerLogout() {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    this.showToast('👋 Đã đăng xuất tài khoản!');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  },

  initAuthModal() {
    // Tạo modal đăng nhập/đăng ký nếu chưa có
    if (!document.getElementById('customerAuthModal')) {
      const modalHtml = `
        <div class="modal fade" id="customerAuthModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4 border-0 shadow">
              <div class="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">
                <h5 class="modal-title fw-bold text-primary" id="authModalTitle">
                  <i class="fas fa-user-circle me-2"></i>Tài khoản Cửa hàng
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body p-4">
                <!-- VIEW KHI ĐÃ ĐĂNG NHẬP -->
                <div id="auth-logged-in-view" style="display: none;">
                  <div class="text-center mb-4">
                    <div id="auth-avatar-icon" class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm" style="width: 75px; height: 75px; font-size: 32px;">
                      <i class="fas fa-user"></i>
                    </div>
                    <div id="auth-admin-badge" class="mt-2" style="display: none;">
                      <span class="badge bg-warning text-dark px-3 py-1 fs-6 rounded-pill shadow-sm">
                        <i class="fas fa-user-shield me-1"></i> Quản trị viên (Admin)
                      </span>
                    </div>
                    <h5 class="mt-3 fw-bold mb-1" id="auth-user-name">Khách hàng</h5>
                    <p class="text-muted small" id="auth-user-email">email@example.com</p>
                  </div>
                  <div class="d-grid gap-2">
                    <a id="btn-goto-admin" href="/admin/index.html" class="btn btn-warning rounded-pill py-2 text-dark fw-bold shadow-sm" style="display: none;">
                      <i class="fas fa-tachometer-alt me-2"></i> Vào Bảng Quản trị (Admin Dashboard)
                    </a>
                    <button onclick="app.customerLogout()" class="btn btn-outline-danger rounded-pill py-2">
                      <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
                    </button>
                  </div>
                </div>

                <!-- VIEW ĐĂNG NHẬP / ĐĂNG KÝ -->
                <div id="auth-login-view">
                  <ul class="nav nav-pills nav-fill mb-4 bg-light rounded-pill p-1 gap-1">
                    <li class="nav-item">
                      <button class="nav-link active rounded-pill fw-bold" id="tab-btn-login" onclick="app.switchAuthTab('login')">
                        <i class="fas fa-shopping-bag me-1"></i> Khách hàng
                      </button>
                    </li>
                    <li class="nav-item">
                      <button class="nav-link rounded-pill fw-bold" id="tab-btn-register" onclick="app.switchAuthTab('register')">
                        <i class="fas fa-user-plus me-1"></i> Đăng ký
                      </button>
                    </li>
                    <li class="nav-item">
                      <a href="/admin/page-login.html" class="nav-link rounded-pill fw-bold text-dark text-center text-decoration-none" id="tab-btn-admin" style="background: rgba(255, 193, 7, 0.25);">
                        <i class="fas fa-user-shield me-1"></i> Quản trị
                      </a>
                    </li>
                  </ul>

                  <!-- 1. FORM ĐĂNG NHẬP KHÁCH HÀNG -->
                  <form id="customer-login-form">
                    <div class="mb-3">
                      <label class="form-label small fw-bold">Địa chỉ Email</label>
                      <input type="email" id="login-email" class="form-control rounded-pill px-3 py-2" placeholder="khachhang@gmail.com" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label small fw-bold">Mật khẩu</label>
                      <input type="password" id="login-password" class="form-control rounded-pill px-3 py-2" placeholder="••••••" required>
                    </div>
                    <button type="submit" id="btn-customer-login" class="btn btn-primary w-100 rounded-pill py-2 text-white fw-bold mt-2 shadow-sm">
                      Đăng nhập Khách hàng
                    </button>
                    <p class="small text-muted text-center mt-3 mb-0">
                      Tài khoản demo: <code>khachhang@gmail.com</code> / <code>123456</code>
                    </p>
                    <div class="mt-3 pt-3 border-top text-center">
                      <span class="small text-muted">Bạn là Quản trị viên của cửa hàng?</span><br>
                      <a href="/admin/page-login.html" class="btn btn-sm btn-outline-warning text-dark fw-bold rounded-pill px-3 py-1 mt-1 text-decoration-none">
                        <i class="fas fa-user-shield me-1"></i> Đăng nhập trang Quản trị riêng (Admin) &rarr;
                      </a>
                    </div>
                  </form>

                  <!-- 2. FORM ĐĂNG NHẬP ADMIN (QUẢN TRỊ VIÊN) -->
                  <form id="admin-login-form" style="display: none;">
                    <div class="alert alert-warning border-0 rounded-4 p-3 mb-3 d-flex align-items-center gap-2">
                      <div class="fs-3 text-warning"><i class="fas fa-user-shield"></i></div>
                      <div class="small text-dark">
                        <strong>Khu vực Quản trị viên (Admin):</strong> Đăng nhập để quản lý sản phẩm, đơn hàng, khách hàng và hệ thống.
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label small fw-bold text-dark">Email Quản trị (Admin Email)</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-end-0 rounded-start-pill"><i class="fas fa-envelope text-muted"></i></span>
                        <input type="email" id="admin-email" class="form-control border-start-0 rounded-end-pill px-3 py-2" placeholder="admin@fruitables.com" value="admin@fruitables.com" required>
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label small fw-bold text-dark">Mật khẩu Admin</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-end-0 rounded-start-pill"><i class="fas fa-lock text-muted"></i></span>
                        <input type="password" id="admin-password" class="form-control border-start-0 rounded-end-pill px-3 py-2" placeholder="••••••••" value="admin123" required>
                      </div>
                    </div>

                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <button type="button" onclick="document.getElementById('admin-email').value='admin@fruitables.com'; document.getElementById('admin-password').value='admin123';" class="btn btn-sm btn-light border rounded-pill px-2 py-1 small text-muted">
                        ⚡ Điền nhanh tài khoản Admin
                      </button>
                      <a href="/admin/page-login.html" class="small text-primary text-decoration-none fw-bold">Mở trang Admin riêng &rarr;</a>
                    </div>

                    <button type="submit" id="btn-admin-submit" class="btn btn-warning w-100 rounded-pill py-2 text-dark fw-bold shadow-sm">
                      <i class="fas fa-sign-in-alt me-2"></i> Đăng nhập vào Quản trị
                    </button>

                    <p class="small text-muted text-center mt-3 mb-0">
                      Tài khoản Admin mặc định: <code>admin@fruitables.com</code> / <code>admin123</code>
                    </p>
                  </form>

                  <!-- 3. FORM ĐĂNG KÝ KHÁCH HÀNG -->
                  <form id="customer-register-form" style="display: none;">
                    <div class="mb-2">
                      <label class="form-label small fw-bold">Họ và tên</label>
                      <input type="text" id="reg-name" class="form-control rounded-pill px-3 py-2" placeholder="Nguyễn Văn A" required>
                    </div>
                    <div class="mb-2">
                      <label class="form-label small fw-bold">Email</label>
                      <input type="email" id="reg-email" class="form-control rounded-pill px-3 py-2" placeholder="name@gmail.com" required>
                    </div>
                    <div class="mb-2">
                      <label class="form-label small fw-bold">Số điện thoại</label>
                      <input type="tel" id="reg-phone" class="form-control rounded-pill px-3 py-2" placeholder="0912345678">
                    </div>
                    <div class="mb-3">
                      <label class="form-label small fw-bold">Mật khẩu (ít nhất 6 ký tự)</label>
                      <input type="password" id="reg-password" class="form-control rounded-pill px-3 py-2" placeholder="••••••" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 text-white fw-bold">
                      Tạo tài khoản
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Gắn sự kiện submit cho form Login Khách hàng
    const loginForm = document.getElementById('customer-login-form');
    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btnSubmit = document.getElementById('btn-customer-login');

        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Đang đăng nhập...`;
        }

        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            localStorage.setItem('customerToken', json.data.token);
            localStorage.setItem('customerUser', JSON.stringify(json.data));

            // Nếu tài khoản này là Admin
            if (json.data.role === 'admin') {
              localStorage.setItem('adminToken', json.data.token);
              localStorage.setItem('adminUser', JSON.stringify(json.data));
              app.showToast('Chào mừng Quản trị viên (Admin)!');
            } else {
              app.showToast('🎉 Đăng nhập thành công!');
            }

            const modalEl = document.getElementById('customerAuthModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            setTimeout(() => window.location.reload(), 600);
          } else {
            alert('❌ ' + (json.message || 'Email hoặc mật khẩu không chính xác'));
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML = `Đăng nhập Khách hàng`;
            }
          }
        } catch (err) {
          alert('❌ Lỗi kết nối đến máy chủ backend');
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `Đăng nhập Khách hàng`;
          }
        }
      };
    }

    // Gắn sự kiện submit cho form Login Admin
    const adminForm = document.getElementById('admin-login-form');
    if (adminForm) {
      adminForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;
        const btnSubmit = document.getElementById('btn-admin-submit');

        if (!email || !password) {
          alert('Vui lòng nhập Email và Mật khẩu Quản trị!');
          return;
        }

        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Đang xác thực quyền Admin...`;
        }

        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            if (json.data.role !== 'admin') {
              alert('⛔ Truy cập bị từ chối: Tài khoản này không có quyền Quản trị viên (Admin)!');
              if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<i class="fas fa-sign-in-alt me-2"></i> Đăng nhập vào Quản trị`;
              }
              return;
            }

            // Lưu cả token admin và customer
            localStorage.setItem('adminToken', json.data.token);
            localStorage.setItem('adminUser', JSON.stringify(json.data));
            localStorage.setItem('customerToken', json.data.token);
            localStorage.setItem('customerUser', JSON.stringify(json.data));

            app.showToast('Đăng nhập Admin thành công! Đang chuyển hướng vào Bảng điều khiển...');
            setTimeout(() => {
              window.location.href = '/admin/index.html';
            }, 800);
          } else {
            alert('❌ ' + (json.message || 'Email hoặc mật khẩu Admin không chính xác'));
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML = `<i class="fas fa-sign-in-alt me-2"></i> Đăng nhập vào Quản trị`;
            }
          }
        } catch (err) {
          console.error(err);
          alert('❌ Lỗi kết nối đến máy chủ backend');
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fas fa-sign-in-alt me-2"></i> Đăng nhập vào Quản trị`;
          }
        }
      };
    }

    // Gắn sự kiện submit cho form Register
    const regForm = document.getElementById('customer-register-form');
    if (regForm) {
      regForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-password').value;

        try {
          const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password }),
          });
          const json = await res.json();
          if (json.success) {
            localStorage.setItem('customerToken', json.data.token);
            localStorage.setItem('customerUser', JSON.stringify(json.data));
            app.showToast('🎉 Đăng ký tài khoản thành công!');
            setTimeout(() => window.location.reload(), 600);
          } else {
            alert('❌ ' + (json.message || 'Đăng ký thất bại'));
          }
        } catch (err) {
          alert('❌ Lỗi kết nối đến máy chủ backend');
        }
      };
    }

    // Gắn sự kiện mở Modal khi bấm icon User
    document.querySelectorAll('.btn-user-auth').forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const user = app.getCustomerInfo();
        const modalEl = document.getElementById('customerAuthModal');
        if (!modalEl) return;

        if (user) {
          document.getElementById('auth-logged-in-view').style.display = 'block';
          document.getElementById('auth-login-view').style.display = 'none';
          document.getElementById('auth-user-name').textContent = user.name || 'Khách hàng';
          document.getElementById('auth-user-email').textContent = user.email || '';

          const adminBadge = document.getElementById('auth-admin-badge');
          const btnAdmin = document.getElementById('btn-goto-admin');
          const avatarIcon = document.getElementById('auth-avatar-icon');

          if (user.role === 'admin') {
            if (adminBadge) adminBadge.style.display = 'block';
            if (btnAdmin) btnAdmin.style.display = 'block';
            if (avatarIcon) {
              avatarIcon.className = 'bg-warning text-dark rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm';
              avatarIcon.innerHTML = '<i class="fas fa-user-shield text-warning"></i>';
            }
          } else {
            if (adminBadge) adminBadge.style.display = 'none';
            if (btnAdmin) btnAdmin.style.display = 'none';
            if (avatarIcon) {
              avatarIcon.className = 'bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm';
              avatarIcon.innerHTML = '<i class="fas fa-user"></i>';
            }
          }
        } else {
          document.getElementById('auth-logged-in-view').style.display = 'none';
          document.getElementById('auth-login-view').style.display = 'block';
        }

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      };
    });
  },

  switchAuthTab(tab) {
    const loginForm = document.getElementById('customer-login-form');
    const adminForm = document.getElementById('admin-login-form');
    const regForm = document.getElementById('customer-register-form');
    const btnLogin = document.getElementById('tab-btn-login');
    const btnAdmin = document.getElementById('tab-btn-admin');
    const btnReg = document.getElementById('tab-btn-register');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (adminForm) adminForm.style.display = 'none';
      if (regForm) regForm.style.display = 'none';

      if (btnLogin) {
        btnLogin.classList.add('active', 'bg-primary', 'text-white');
        btnLogin.classList.remove('bg-light', 'text-dark');
      }
      if (btnAdmin) {
        btnAdmin.classList.remove('active', 'bg-warning', 'text-dark', 'fw-bold');
      }
      if (btnReg) {
        btnReg.classList.remove('active', 'bg-primary', 'text-white');
      }
    } else if (tab === 'admin') {
      if (loginForm) loginForm.style.display = 'none';
      if (adminForm) adminForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';

      if (btnAdmin) {
        btnAdmin.classList.add('active', 'bg-warning', 'text-dark');
      }
      if (btnLogin) {
        btnLogin.classList.remove('active', 'bg-primary', 'text-white');
      }
      if (btnReg) {
        btnReg.classList.remove('active', 'bg-primary', 'text-white');
      }
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (adminForm) adminForm.style.display = 'none';
      if (regForm) regForm.style.display = 'block';

      if (btnReg) {
        btnReg.classList.add('active', 'bg-primary', 'text-white');
      }
      if (btnLogin) {
        btnLogin.classList.remove('active', 'bg-primary', 'text-white');
      }
      if (btnAdmin) {
        btnAdmin.classList.remove('active', 'bg-warning', 'text-dark');
      }
    }
  },

  // ==========================================
  // 7. KHỞI TẠO TỔNG THỂ (Init)
  // ==========================================
  init() {
    this.initTheme();
    this.updateCartBadge();
    this.initAuthModal();

    // Hiển thị huy hiệu admin trên Topbar nếu đang đăng nhập quyền Admin
    const user = this.getCustomerInfo();
    if (user && user.role === 'admin') {
      const topLink = document.querySelector('.top-link');
      if (topLink && !document.getElementById('nav-admin-portal-link')) {
        const adminLinkHtml = `
          <a href="/admin/index.html" id="nav-admin-portal-link" class="text-white ms-2 text-decoration-none" title="Chuyển sang Bảng điều khiển Quản trị">
            <span class="badge bg-warning text-dark px-2 py-1"><i class="fas fa-user-shield me-1"></i>Trang Quản Trị</span>
          </a>
        `;
        topLink.insertAdjacentHTML('beforeend', adminLinkHtml);
      }
    }

    // Trang chủ hoặc Trang shop
    if (document.getElementById('dynamic-products-container')) {
      this.loadProducts();
    }

    // Trang giỏ hàng
    if (document.getElementById('cart-table-body')) {
      this.renderCartPage();
    }

    // Trang thanh toán
    if (document.getElementById('checkout-items-summary')) {
      this.renderCheckoutPage();
    }
  },
};

// Tự động khởi chạy khi trang nạp xong
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
