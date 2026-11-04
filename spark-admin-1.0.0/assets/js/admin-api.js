/**
 * Spark Admin Backend Integration Engine
 * Kết nối giao diện Quản trị với RESTful API Node.js & MongoDB
 */

// Áp dụng theme lưu trữ ngay lập tức để tránh giật giao diện (FOUC prevention)
(function () {
  try {
    const saved = localStorage.getItem('fruitables_theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (document.body) document.body.classList.add('dark-theme');
    }
  } catch (e) {}
})();

const API_BASE = window.location.origin + '/api';

const admin = {
  // ==========================================
  // 0. QUẢN LÝ GIAO DIỆN TỐI / SÁNG (Dark / Light Theme)
  // ==========================================
  initTheme() {
    const savedTheme = localStorage.getItem('fruitables_theme') || 'light';
    this.applyTheme(savedTheme);

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btn-theme-toggle, .btn-theme-toggle');
      if (btn) {
        e.preventDefault();
        const isDark =
          document.body.classList.contains('dark-theme') ||
          document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';
        this.applyTheme(nextTheme);
      }
    });

    this.ensureThemeToggleInNavbar();
  },

  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (document.body) document.body.classList.add('dark-theme');
      localStorage.setItem('fruitables_theme', 'dark');
      this.updateThemeIcons('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (document.body) document.body.classList.remove('dark-theme');
      localStorage.setItem('fruitables_theme', 'light');
      this.updateThemeIcons('light');
    }
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  },

  updateThemeIcons(theme) {
    document.querySelectorAll('#btn-theme-toggle, .btn-theme-toggle').forEach((btn) => {
      if (theme === 'dark') {
        btn.innerHTML = '<i class="bi bi-sun-fill text-warning"></i>';
        btn.setAttribute('title', 'Chuyển sang giao diện Sáng');
        btn.setAttribute('aria-label', 'Chuyển sang giao diện Sáng');
      } else {
        btn.innerHTML = '<i class="bi bi-moon-stars"></i>';
        btn.setAttribute('title', 'Chuyển sang giao diện Tối');
        btn.setAttribute('aria-label', 'Chuyển sang giao diện Tối');
      }
    });
  },

  ensureThemeToggleInNavbar() {
    const navbarActions = document.querySelector('.navbar-actions');
    if (navbarActions && !navbarActions.querySelector('#btn-theme-toggle')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'navbar-action-btn me-1';
      toggleBtn.id = 'btn-theme-toggle';
      const isDark =
        (document.body && document.body.classList.contains('dark-theme')) ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      toggleBtn.innerHTML = isDark
        ? '<i class="bi bi-sun-fill text-warning"></i>'
        : '<i class="bi bi-moon-stars"></i>';
      toggleBtn.title = isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối';
      toggleBtn.setAttribute('aria-label', toggleBtn.title);

      const fullscreenBtn = navbarActions.querySelector('#btn-fullscreen');
      if (fullscreenBtn) {
        navbarActions.insertBefore(toggleBtn, fullscreenBtn);
      } else {
        navbarActions.prepend(toggleBtn);
      }
    }
  },

  // Lấy token đăng nhập của admin
  getToken() {
    return localStorage.getItem('adminToken');
  },

  getAdminUser() {
    try {
      const u = localStorage.getItem('adminUser');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  formatImageUrl(imgSrc) {
    if (!imgSrc || typeof imgSrc !== 'string' || imgSrc.trim() === '') {
      return '/fruitables-1.0.0/img/fruite-item-5.jpg';
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
    if (imgSrc.startsWith('img/')) {
      return '/fruitables-1.0.0/' + imgSrc;
    }
    return imgSrc;
  },

  // Kiểm tra đăng nhập bắt buộc cho các trang quản trị
  checkAuth() {
    const token = this.getToken();
    const isLoginPage = window.location.pathname.endsWith('page-login.html');
    const is404Page = window.location.pathname.endsWith('page-404.html');

    if (is404Page) return true;

    if (!token && !isLoginPage) {
      window.location.href = 'page-login.html';
      return false;
    }

    if (token && isLoginPage) {
      window.location.href = 'index.html';
      return false;
    }

    // Hiển thị tên Admin trên thanh Header
    const user = this.getAdminUser();
    if (user) {
      document.querySelectorAll('.admin-display-name').forEach((el) => {
        el.textContent = user.name || 'Quản trị viên';
      });
      document.querySelectorAll('.admin-display-email').forEach((el) => {
        el.textContent = user.email || 'admin@fruitables.com';
      });
    }

    return true;
  },

  logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/client/index.html';
  },

  // ==========================================
  // 1. TRANG ĐĂNG NHẬP ADMIN (page-login.html)
  // ==========================================
  initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = document.getElementById('btn-submit');

      if (!email || !password) {
        alert('Vui lòng nhập đầy đủ Email và Mật khẩu!');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Đang xác thực...</span>`;
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
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = `<span>Đăng nhập vào Quản trị</span>`;
            }
            return;
          }

          localStorage.setItem('adminToken', json.data.token);
          localStorage.setItem('adminUser', JSON.stringify(json.data));
          window.location.href = 'index.html';
        } else {
          alert('❌ Đăng nhập thất bại: ' + (json.message || 'Email hoặc mật khẩu không chính xác'));
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Đăng nhập vào Quản trị</span>`;
          }
        }
      } catch (err) {
        console.error(err);
        alert('❌ Lỗi kết nối đến máy chủ backend!');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Đăng nhập vào Quản trị</span>`;
        }
      }
    };
  },

  // ==========================================
  // 2. DASHBOARD TỔNG QUAN (index.html)
  // ==========================================
  async loadDashboard() {
    const statRevenue = document.getElementById('stat-revenue');
    const statOrders = document.getElementById('stat-orders');
    const statProducts = document.getElementById('stat-products');
    const recentOrdersTbody = document.getElementById('recent-orders-tbody');

    const token = this.getToken();
    if (!token) return;

    try {
      // 1. Lấy danh sách sản phẩm
      const resProducts = await fetch(`${API_BASE}/products`);
      const dataProducts = await resProducts.json();
      if (dataProducts.success && statProducts) {
        statProducts.textContent = dataProducts.count || 0;
      }

      // 2. Lấy danh sách đơn hàng
      const resOrders = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataOrders = await resOrders.json();

      if (dataOrders.success && dataOrders.data) {
        const orders = dataOrders.data;
        if (statOrders) statOrders.textContent = orders.length;

        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        if (statRevenue) statRevenue.textContent = `${totalRevenue.toLocaleString('vi-VN')} đ`;

        if (recentOrdersTbody) {
          if (orders.length === 0) {
            recentOrdersTbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Chưa có đơn hàng nào</td></tr>`;
          } else {
            recentOrdersTbody.innerHTML = orders
              .slice(0, 5)
              .map((o) => {
                const dateStr = new Date(o.createdAt).toLocaleDateString('vi-VN');
                const customerName = (o.shippingAddress && o.shippingAddress.fullName) || 'Khách hàng';
                const statusBadge =
                  o.orderStatus === 'Completed'
                    ? '<span class="badge bg-success">Hoàn thành</span>'
                    : o.orderStatus === 'Cancelled'
                    ? '<span class="badge bg-danger">Đã hủy</span>'
                    : '<span class="badge bg-warning text-dark">Chờ xử lý</span>';

                return `
                  <tr>
                    <td><strong>#${o._id.substring(o._id.length - 6).toUpperCase()}</strong></td>
                    <td>${customerName}</td>
                    <td>${dateStr}</td>
                    <td class="fw-bold">${o.totalPrice.toLocaleString('vi-VN')} đ</td>
                    <td>${statusBadge}</td>
                    <td>${o.paymentMethod}</td>
                  </tr>
                `;
              })
              .join('');
          }
        }
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu Dashboard:', e);
    }
  },

  // ==========================================
  // 3. QUẢN LÝ SẢN PHẨM & DỮ LIỆU (tables-basic.html)
  // ==========================================
  currentProducts: [],
  categories: [],

  async loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const json = await res.json();
      if (json.success && json.data) {
        this.categories = json.data;

        // Cập nhật select box trong modals
        ['pCategory', 'editPCategory'].forEach((selectId) => {
          const select = document.getElementById(selectId);
          if (select) {
            const currentVal = select.value;
            select.innerHTML = '<option value="" disabled selected>Chọn danh mục...</option>' +
              this.categories.map((c) => `<option value="${c._id}">${c.name}</option>`).join('');
            if (currentVal) select.value = currentVal;
          }
        });

        // Cập nhật menu lọc danh mục
        const filterMenu = document.getElementById('categoryFilterMenu');
        if (filterMenu) {
          filterMenu.innerHTML = '<li><a class="dropdown-item active" href="#" data-cat="all">Tất cả danh mục</a></li>' +
            this.categories.map((c) => `<li><a class="dropdown-item" href="#" data-cat="${c._id}">${c.name}</a></li>`).join('');
          this.initCategoryFilterListener();
        }
      }
    } catch (e) {
      console.warn('Không thể nạp danh mục:', e);
    }
  },

  async loadProductsManagement() {
    const tableBody = document.getElementById('admin-products-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
      <div class="spinner-border spinner-border-sm text-success me-2" role="status"></div>
      Đang tải danh sách nông sản...
    </td></tr>`;

    await this.loadCategories();

    try {
      const res = await fetch(`${API_BASE}/products`);
      const json = await res.json();

      if (!json.success || !json.data || json.data.length === 0) {
        this.currentProducts = [];
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Chưa có sản phẩm nào trong kho dữ liệu.</td></tr>`;
        return;
      }

      this.currentProducts = json.data;
      this.renderProductsTable(this.currentProducts);
      this.initProductSearchAndFilter();
      this.initProductModals();
    } catch (e) {
      console.error(e);
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">❌ Lỗi kết nối khi tải danh sách sản phẩm.</td></tr>`;
    }
  },

  renderProductsTable(productsList) {
    const tableBody = document.getElementById('admin-products-table-body');
    if (!tableBody) return;

    if (!productsList || productsList.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Không tìm thấy sản phẩm nào phù hợp điều kiện lọc.</td></tr>`;
      return;
    }

    tableBody.innerHTML = productsList
      .map((p, index) => {
        const image = this.formatImageUrl(p.images && p.images[0]);
        let categoryName = 'Trái cây tươi';
        if (p.category) {
          categoryName = typeof p.category === 'object' ? p.category.name : p.category;
          const matched = this.categories.find((c) => c._id === p.category || c._id === (p.category && p.category._id));
          if (matched) categoryName = matched.name;
        }

        const priceFormatted = Number(p.price || 0).toLocaleString('vi-VN');
        const unit = p.unit || 'kg';
        const inStock = Number(p.countInStock || 0);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>
              <img src="${image}" onerror="this.onerror=null; this.src='/fruitables-1.0.0/img/fruite-item-5.jpg';" class="rounded shadow-sm" style="width: 45px; height: 45px; object-fit: cover;" alt="${p.name}">
            </td>
            <td>
              <span class="fw-bold">${p.name}</span>
              ${p.isFeatured ? '<span class="badge bg-warning text-dark ms-1" style="font-size: 0.65rem; font-weight: 700;">Nổi bật</span>' : ''}
            </td>
            <td>
              <span class="badge-category"><i class="bi bi-tag-fill me-1"></i>${categoryName}</span>
            </td>
            <td>
              <span class="fw-bold text-success">${priceFormatted} đ</span>
              <small class="text-muted">/${unit}</small>
            </td>
            <td>
              <span class="badge ${inStock > 0 ? 'bg-success' : 'bg-danger'} px-2 py-1">
                ${inStock > 0 ? inStock : 'Hết hàng'}
              </span>
            </td>
            <td class="text-center">
              <div class="d-flex justify-content-center gap-1">
                <button type="button" onclick="admin.openEditProductModal('${p._id}')" class="btn btn-sm btn-outline-success" title="Chỉnh sửa sản phẩm">
                  <i class="bi bi-pencil-square"></i> Sửa
                </button>
                <button type="button" onclick="admin.deleteProduct('${p._id}')" class="btn btn-sm btn-outline-danger" title="Xóa khỏi hệ thống">
                  <i class="bi bi-trash"></i> Xóa
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    const paginationInfo = document.querySelector('.table-pagination-info');
    if (paginationInfo) {
      paginationInfo.textContent = `Hiển thị 1 đến ${productsList.length} trên tổng số ${this.currentProducts.length} sản phẩm`;
    }
  },

  initProductSearchAndFilter() {
    const searchInput = document.getElementById('admin-product-search');
    if (searchInput && !searchInput.dataset.initialized) {
      searchInput.dataset.initialized = 'true';
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          this.renderProductsTable(this.currentProducts);
          return;
        }

        const filtered = this.currentProducts.filter((p) => {
          const name = (p.name || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          let cat = '';
          if (p.category) {
            cat = typeof p.category === 'object' ? (p.category.name || '').toLowerCase() : p.category.toLowerCase();
          }
          return name.includes(query) || desc.includes(query) || cat.includes(query);
        });

        this.renderProductsTable(filtered);
      });
    }

    this.initCategoryFilterListener();
  },

  initCategoryFilterListener() {
    const filterMenu = document.getElementById('categoryFilterMenu');
    if (filterMenu) {
      filterMenu.querySelectorAll('a.dropdown-item').forEach((item) => {
        item.onclick = (e) => {
          e.preventDefault();
          filterMenu.querySelectorAll('a.dropdown-item').forEach((i) => i.classList.remove('active'));
          item.classList.add('active');

          const catId = item.dataset.cat;
          const filterBtn = document.getElementById('dropdownFilterCategory');
          if (filterBtn) {
            filterBtn.innerHTML = `<i class="bi bi-funnel"></i> <span>${item.textContent}</span>`;
          }

          if (catId === 'all') {
            this.renderProductsTable(this.currentProducts);
          } else {
            const filtered = this.currentProducts.filter((p) => {
              if (!p.category) return false;
              if (typeof p.category === 'object') {
                return p.category._id === catId || p.category.name === catId;
              }
              return p.category === catId;
            });
            this.renderProductsTable(filtered);
          }
        };
      });
    }
  },

  initProductModals() {
    // Form thêm sản phẩm
    const addForm = document.getElementById('addProductForm');
    if (addForm && !addForm.dataset.initialized) {
      addForm.dataset.initialized = 'true';
      addForm.onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('btn-save-new-product');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...';
        }

        const formData = new FormData();
        formData.append('name', document.getElementById('pName').value.trim());
        formData.append('category', document.getElementById('pCategory').value);
        formData.append('price', document.getElementById('pPrice').value);
        formData.append('discountPrice', document.getElementById('pDiscountPrice').value || '0');
        formData.append('countInStock', document.getElementById('pStock').value || '0');
        formData.append('unit', document.getElementById('pUnit').value);
        formData.append('description', document.getElementById('pDescription').value.trim());
        formData.append('isFeatured', document.getElementById('pIsFeatured')?.checked ? 'true' : 'false');
        Array.from(document.getElementById('pImage').files || []).forEach((file) => {
          formData.append('images', file);
        });

        try {
          const res = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.getToken()}`,
            },
            body: formData,
          });

          const json = await res.json();
          if (json.success) {
            alert('🎉 Đã thêm sản phẩm thành công!');
            addForm.reset();
            const modalEl = document.getElementById('addProductModal');
            if (modalEl && window.bootstrap) {
              const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
              modalInstance.hide();
            }
            this.loadProductsManagement();
          } else {
            alert('❌ Thêm sản phẩm thất bại: ' + (json.message || 'Lỗi dữ liệu'));
          }
        } catch (err) {
          console.error(err);
          alert('❌ Lỗi kết nối đến máy chủ backend!');
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Lưu sản phẩm';
          }
        }
      };
    }

    // Form sửa sản phẩm
    const editForm = document.getElementById('editProductForm');
    if (editForm && !editForm.dataset.initialized) {
      editForm.dataset.initialized = 'true';
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('editPId').value;
        const saveBtn = document.getElementById('btn-save-edit-product');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang cập nhật...';
        }

        const featCheckbox = document.getElementById('editPIsFeatured');
        const formData = new FormData();
        formData.append('name', document.getElementById('editPName').value.trim());
        formData.append('category', document.getElementById('editPCategory').value);
        formData.append('price', document.getElementById('editPPrice').value);
        formData.append('discountPrice', document.getElementById('editPDiscountPrice').value || '0');
        formData.append('countInStock', document.getElementById('editPStock').value || '0');
        formData.append('unit', document.getElementById('editPUnit').value);
        formData.append('description', document.getElementById('editPDescription').value.trim());
        formData.append('isFeatured', featCheckbox?.checked ? 'true' : 'false');
        Array.from(document.getElementById('editPImage').files || []).forEach((file) => {
          formData.append('images', file);
        });

        try {
          const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.getToken()}`,
            },
            body: formData,
          });

          const json = await res.json();
          if (json.success) {
            alert('✅ Đã cập nhật sản phẩm thành công!');
            const modalEl = document.getElementById('editProductModal');
            if (modalEl && window.bootstrap) {
              const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
              modalInstance.hide();
            }
            this.loadProductsManagement();
          } else {
            alert('❌ Cập nhật thất bại: ' + (json.message || 'Lỗi dữ liệu'));
          }
        } catch (err) {
          console.error(err);
          alert('❌ Lỗi kết nối đến máy chủ backend!');
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-save"></i> Cập nhật thay đổi';
          }
        }
      };
    }
  },

  openEditProductModal(id) {
    const product = this.currentProducts.find((p) => p._id === id);
    if (!product) {
      alert('Không tìm thấy thông tin sản phẩm!');
      return;
    }

    document.getElementById('editPId').value = product._id;
    document.getElementById('editPName').value = product.name || '';
    
    // Khớp danh mục an toàn
    const catSelect = document.getElementById('editPCategory');
    if (catSelect && product.category) {
      const catVal = typeof product.category === 'object' ? product.category._id : product.category;
      catSelect.value = catVal;
      if (!catSelect.value && typeof product.category === 'object' && product.category.name) {
        Array.from(catSelect.options).forEach((opt) => {
          if (opt.textContent.trim() === product.category.name.trim()) {
            catSelect.value = opt.value;
          }
        });
      }
    }

    document.getElementById('editPPrice').value = product.price || 0;
    document.getElementById('editPDiscountPrice').value = product.discountPrice || 0;
    document.getElementById('editPStock').value = product.countInStock || 0;

    // Khớp đơn vị tính (thêm option nếu chưa có)
    const unitSelect = document.getElementById('editPUnit');
    if (unitSelect && product.unit) {
      const exists = Array.from(unitSelect.options).some((o) => o.value === product.unit);
      if (!exists) {
        const opt = document.createElement('option');
        opt.value = product.unit;
        opt.textContent = product.unit;
        unitSelect.appendChild(opt);
      }
      unitSelect.value = product.unit;
    }

    document.getElementById('editPDescription').value = product.description || '';

    const featCheckbox = document.getElementById('editPIsFeatured');
    if (featCheckbox) {
      featCheckbox.checked = Boolean(product.isFeatured);
    }

    const modalEl = document.getElementById('editProductModal');
    if (modalEl && window.bootstrap) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modalInstance.show();
    }
  },

  async deleteProduct(id) {
    const product = this.currentProducts.find((p) => p._id === id);
    const name = product ? product.name : 'sản phẩm này';
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi cơ sở dữ liệu?`)) return;

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        alert('✅ Đã xóa sản phẩm thành công!');
        this.loadProductsManagement();
      } else {
        alert('❌ Xóa thất bại: ' + (json.message || 'Lỗi không xác định'));
      }
    } catch (e) {
      alert('❌ Lỗi kết nối đến máy chủ backend');
    }
  },

  exportProductsCSV() {
    if (!this.currentProducts || this.currentProducts.length === 0) {
      alert('Không có dữ liệu để xuất file!');
      return;
    }

    const headers = ['STT', 'Mã sản phẩm', 'Tên sản phẩm', 'Danh mục', 'Đơn giá (VNĐ)', 'Tồn kho', 'Đơn vị tính'];
    const rows = this.currentProducts.map((p, index) => {
      let catName = 'Trái cây tươi';
      if (p.category) {
        catName = typeof p.category === 'object' ? p.category.name : p.category;
      }
      return [
        index + 1,
        `"${p._id}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${catName.replace(/"/g, '""')}"`,
        p.price || 0,
        p.countInStock || 0,
        `"${p.unit || 'kg'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nong_san_fruitables_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // ==========================================
  // 4. QUẢN LÝ ĐƠN HÀNG (orders.html)
  // ==========================================
  currentOrders: [],

  async loadOrdersManagement() {
    const tableBody = document.getElementById('admin-orders-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">
      <div class="spinner-border spinner-border-sm text-success me-2" role="status"></div>
      Đang tải danh sách đơn hàng...
    </td></tr>`;

    const token = this.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!json.success || !json.data || json.data.length === 0) {
        this.currentOrders = [];
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Chưa có đơn hàng nào trong hệ thống.</td></tr>`;
        const paginationInfo = document.getElementById('order-pagination-info');
        if (paginationInfo) paginationInfo.textContent = 'Tổng số: 0 đơn hàng';
        return;
      }

      this.currentOrders = json.data;
      this.renderOrdersTable(this.currentOrders);
      this.initOrderSearchAndFilter();
      this.initOrderModals();
    } catch (e) {
      console.error(e);
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-danger">❌ Lỗi kết nối khi tải danh sách đơn hàng.</td></tr>`;
    }
  },

  renderOrdersTable(ordersList) {
    const tableBody = document.getElementById('admin-orders-table-body');
    if (!tableBody) return;

    if (!ordersList || ordersList.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Không tìm thấy đơn hàng nào phù hợp điều kiện lọc.</td></tr>`;
      return;
    }

    tableBody.innerHTML = ordersList
      .map((o, index) => {
        const orderCode = `#${o._id.substring(o._id.length - 6).toUpperCase()}`;
        const customerName = (o.shippingAddress && o.shippingAddress.fullName) || 'Khách hàng';
        const customerPhone = (o.shippingAddress && o.shippingAddress.phone) || '';
        const dateStr = new Date(o.createdAt).toLocaleDateString('vi-VN');
        const totalPriceFormatted = Number(o.totalPrice || 0).toLocaleString('vi-VN');

        const itemsCount = o.orderItems ? o.orderItems.length : 0;
        const firstItem = o.orderItems && o.orderItems[0];
        let itemsSummary = `${itemsCount} sản phẩm`;
        if (firstItem) {
          itemsSummary = `${firstItem.name} ${itemsCount > 1 ? `(+${itemsCount - 1})` : ''}`;
        }

        let statusBadge = '<span class="badge bg-warning text-dark px-2 py-1">Chờ xử lý</span>';
        if (o.orderStatus === 'Processing') {
          statusBadge = '<span class="badge bg-info text-dark px-2 py-1">Đang giao</span>';
        } else if (o.orderStatus === 'Completed') {
          statusBadge = '<span class="badge bg-success px-2 py-1">Hoàn thành</span>';
        } else if (o.orderStatus === 'Cancelled') {
          statusBadge = '<span class="badge bg-danger px-2 py-1">Đã hủy</span>';
        }

        const paymentBadge = o.isPaid
          ? '<span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 ms-1">Đã TT</span>'
          : '<span class="badge bg-secondary bg-opacity-25 text-secondary border ms-1">Chưa TT</span>';

        return `
          <tr>
            <td>${index + 1}</td>
            <td><strong class="text-success">${orderCode}</strong></td>
            <td>
              <div class="fw-bold">${customerName}</div>
              <small class="text-muted"><i class="bi bi-telephone"></i> ${customerPhone}</small>
            </td>
            <td>
              <span title="${itemsSummary}">${itemsSummary}</span>
            </td>
            <td>
              <span class="fw-bold text-success">${totalPriceFormatted} đ</span>
            </td>
            <td>
              <span>${o.paymentMethod || 'COD'}</span>${paymentBadge}
            </td>
            <td><small class="text-muted">${dateStr}</small></td>
            <td class="text-center">${statusBadge}</td>
            <td class="text-center">
              <div class="d-flex justify-content-center gap-1">
                <button type="button" onclick="admin.openViewOrderModal('${o._id}')" class="btn btn-sm btn-outline-primary" title="Xem chi tiết đơn hàng">
                  <i class="bi bi-eye"></i>
                </button>
                <button type="button" onclick="admin.openUpdateStatusModal('${o._id}')" class="btn btn-sm btn-outline-success" title="Cập nhật trạng thái">
                  <i class="bi bi-pencil-square"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    const paginationInfo = document.getElementById('order-pagination-info');
    if (paginationInfo) {
      paginationInfo.textContent = `Hiển thị 1 đến ${ordersList.length} trên tổng số ${this.currentOrders.length} đơn hàng`;
    }
  },

  initOrderSearchAndFilter() {
    const searchInput = document.getElementById('admin-order-search');
    if (searchInput && !searchInput.dataset.initialized) {
      searchInput.dataset.initialized = 'true';
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          this.renderOrdersTable(this.currentOrders);
          return;
        }

        const filtered = this.currentOrders.filter((o) => {
          const code = o._id ? o._id.toLowerCase() : '';
          const name = (o.shippingAddress && o.shippingAddress.fullName ? o.shippingAddress.fullName : '').toLowerCase();
          const phone = (o.shippingAddress && o.shippingAddress.phone ? o.shippingAddress.phone : '').toLowerCase();
          const addr = (o.shippingAddress && o.shippingAddress.address ? o.shippingAddress.address : '').toLowerCase();
          return code.includes(query) || name.includes(query) || phone.includes(query) || addr.includes(query);
        });

        this.renderOrdersTable(filtered);
      });
    }

    const filterMenu = document.getElementById('orderStatusFilterMenu');
    if (filterMenu) {
      filterMenu.querySelectorAll('a.dropdown-item').forEach((item) => {
        item.onclick = (e) => {
          e.preventDefault();
          filterMenu.querySelectorAll('a.dropdown-item').forEach((i) => i.classList.remove('active'));
          item.classList.add('active');

          const status = item.dataset.status;
          const filterBtn = document.getElementById('dropdownFilterOrderStatus');
          if (filterBtn) {
            filterBtn.innerHTML = `<i class="bi bi-funnel"></i> <span>${item.textContent}</span>`;
          }

          if (status === 'all') {
            this.renderOrdersTable(this.currentOrders);
          } else {
            const filtered = this.currentOrders.filter((o) => o.orderStatus === status);
            this.renderOrdersTable(filtered);
          }
        };
      });
    }
  },

  initOrderModals() {
    const form = document.getElementById('updateOrderStatusForm');
    if (form && !form.dataset.initialized) {
      form.dataset.initialized = 'true';
      form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('editOrderId').value;
        const status = document.getElementById('editOrderStatusSelect').value;
        const isPaid = document.getElementById('editOrderIsPaid').checked;
        const saveBtn = document.getElementById('btn-save-order-status');

        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang cập nhật...';
        }

        try {
          const res = await fetch(`${API_BASE}/orders/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.getToken()}`,
            },
            body: JSON.stringify({ orderStatus: status, isPaid }),
          });

          const json = await res.json();
          if (json.success) {
            alert('✅ Cập nhật trạng thái đơn hàng thành công!');
            const modalEl = document.getElementById('updateOrderStatusModal');
            if (modalEl && window.bootstrap) {
              const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
              modalInstance.hide();
            }
            this.loadOrdersManagement();
          } else {
            alert('❌ Cập nhật thất bại: ' + (json.message || 'Lỗi không xác định'));
          }
        } catch (err) {
          console.error(err);
          alert('❌ Lỗi kết nối đến máy chủ backend!');
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Lưu cập nhật';
          }
        }
      };
    }
  },

  openUpdateStatusModal(id) {
    const order = this.currentOrders.find((o) => o._id === id);
    if (!order) return;

    document.getElementById('editOrderId').value = order._id;
    document.getElementById('editOrderCode').value = `#${order._id.substring(order._id.length - 6).toUpperCase()}`;
    document.getElementById('editOrderCustomer').value = (order.shippingAddress && order.shippingAddress.fullName) || 'Khách hàng';
    document.getElementById('editOrderStatusSelect').value = order.orderStatus || 'Pending';
    document.getElementById('editOrderIsPaid').checked = Boolean(order.isPaid);

    const modalEl = document.getElementById('updateOrderStatusModal');
    if (modalEl && window.bootstrap) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modalInstance.show();
    }
  },

  openViewOrderModal(id) {
    const order = this.currentOrders.find((o) => o._id === id);
    if (!order) return;

    document.getElementById('viewOrderCode').textContent = `#${order._id.substring(order._id.length - 6).toUpperCase()}`;
    const s = order.shippingAddress || {};
    document.getElementById('viewCustomerName').textContent = s.fullName || 'Chưa cập nhật';
    document.getElementById('viewCustomerPhone').textContent = s.phone || 'Chưa cập nhật';
    document.getElementById('viewCustomerEmail').textContent = s.email || 'Chưa cập nhật';
    document.getElementById('viewCustomerAddress').textContent = `${s.address || ''}, ${s.city || ''}`;
    document.getElementById('viewOrderDate').textContent = new Date(order.createdAt).toLocaleString('vi-VN');
    document.getElementById('viewOrderPayment').textContent = `${order.paymentMethod || 'COD'} (${order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'})`;
    document.getElementById('viewOrderNote').textContent = s.note || 'Không có';

    let badge = '<span class="badge bg-warning text-dark">Chờ xử lý</span>';
    if (order.orderStatus === 'Processing') badge = '<span class="badge bg-info text-dark">Đang giao hàng</span>';
    else if (order.orderStatus === 'Completed') badge = '<span class="badge bg-success">Hoàn thành</span>';
    else if (order.orderStatus === 'Cancelled') badge = '<span class="badge bg-danger">Đã hủy</span>';
    document.getElementById('viewOrderStatusBadge').innerHTML = badge;

    const tbody = document.getElementById('viewOrderItemsTable');
    if (tbody && order.orderItems) {
      tbody.innerHTML = order.orderItems
        .map((item, idx) => {
          const itemTotal = (item.price || 0) * (item.qty || 1);
          return `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${item.name}</strong></td>
              <td class="text-center">${Number(item.price || 0).toLocaleString('vi-VN')} đ</td>
              <td class="text-center">${item.qty}</td>
              <td class="text-end fw-bold">${itemTotal.toLocaleString('vi-VN')} đ</td>
            </tr>
          `;
        })
        .join('');
    }

    document.getElementById('viewOrderTotal').textContent = `${Number(order.totalPrice || 0).toLocaleString('vi-VN')} đ`;

    const modalEl = document.getElementById('viewOrderModal');
    if (modalEl && window.bootstrap) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modalInstance.show();
    }
  },

  exportOrdersCSV() {
    if (!this.currentOrders || this.currentOrders.length === 0) {
      alert('Không có dữ liệu đơn hàng để xuất file!');
      return;
    }

    const headers = ['STT', 'Mã đơn', 'Khách hàng', 'SĐT', 'Địa chỉ', 'Tổng tiền (VNĐ)', 'Phương thức TT', 'Trạng thái', 'Ngày đặt'];
    const rows = this.currentOrders.map((o, index) => {
      const s = o.shippingAddress || {};
      return [
        index + 1,
        `"${o._id}"`,
        `"${(s.fullName || '').replace(/"/g, '""')}"`,
        `"${s.phone || ''}"`,
        `"${(s.address || '').replace(/"/g, '""')}"`,
        o.totalPrice || 0,
        `"${o.paymentMethod || 'COD'}"`,
        `"${o.orderStatus || 'Pending'}"`,
        `"${new Date(o.createdAt).toLocaleDateString('vi-VN')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `don_hang_fruitables_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  init() {
    this.initTheme();
    this.checkAuth();

    if (window.location.pathname.endsWith('page-login.html')) {
      this.initLoginPage();
    }
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/')) {
      this.loadDashboard();
    }
    if (window.location.pathname.endsWith('tables-basic.html')) {
      this.loadProductsManagement();
    }
    if (window.location.pathname.endsWith('orders.html')) {
      this.loadOrdersManagement();
    }

    document.querySelectorAll('.btn-admin-logout').forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        this.logout();
      };
    });
  },
};

document.addEventListener('DOMContentLoaded', () => {
  admin.init();
});
