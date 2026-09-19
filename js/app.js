/* ==========================================================================
   TADBEER POS - APPLICATION CORE ENGINE (Updated with Shift & Products Navigation)
   ========================================================================== */

class AppEngine {
  constructor() {
    this.cart = [];
    this.activeCategory = 'shawarma';
    this.currentUser = { name: 'أحمد كاشير', role: 'cashier' };
    this.orderType = 'takeaway';
    this.paymentMethod = 'cash';
    this.discountAmount = 0;
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderCategories();
    this.renderProducts();
    this.renderCart();
  }

  bindEvents() {
    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.clearCart();
        showToast('تم فتح طلب جديد', 'info');
      } else if (e.key === 'F4') {
        e.preventDefault();
        this.openCheckoutModal();
      } else if (e.key === 'F9') {
        e.preventDefault();
        this.confirmCheckoutAndPrint();
      }
    });

    // Auto KDS Timers refresh every second
    setInterval(() => {
      const activeScreen = document.querySelector('.screen-container.active');
      if (activeScreen && activeScreen.id === 'kds-screen') {
        kdsManager.renderKDSGrid(document.getElementById('kds-grid-container'));
      }
    }, 2000);
  }

  switchScreen(screenId) {
    document.querySelectorAll('.screen-container').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    const targetNav = document.querySelector(`.nav-btn[data-screen="${screenId}"]`);
    if (targetNav) targetNav.classList.add('active');

    if (screenId === 'kds-screen') {
      kdsManager.renderKDSGrid(document.getElementById('kds-grid-container'));
    } else if (screenId === 'reports-screen') {
      reportsManager.renderDashboard(document.getElementById('reports-screen'));
    } else if (screenId === 'active-orders-screen') {
      this.renderActiveOrders();
    } else if (screenId === 'settings-screen') {
      this.loadSettingsScreen();
    } else if (screenId === 'shift-screen') {
      accountingManager.renderShiftScreen(document.getElementById('shift-screen'));
    } else if (screenId === 'products-admin-screen') {
      productManager.renderProductAdminScreen(document.getElementById('products-admin-screen'));
    }
  }

  renderCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    const categories = db.getCategories();
    container.innerHTML = categories.map(cat => `
      <div class="category-btn ${cat.id === this.activeCategory ? 'active' : ''}" onclick="app.setCategory('${cat.id}')">
        <i class="fas ${cat.icon}"></i>
        <span>${cat.name}</span>
      </div>
    `).join('');
  }

  setCategory(catId) {
    this.activeCategory = catId;
    this.renderCategories();
    this.renderProducts();
  }

  renderProducts(searchQuery = '') {
    const container = document.getElementById('products-grid');
    if (!container) return;

    let products = db.getProducts();
    if (searchQuery) {
      products = products.filter(p => p.name.includes(searchQuery) || p.desc.includes(searchQuery));
    } else {
      products = products.filter(p => p.categoryId === this.activeCategory);
    }

    container.innerHTML = products.map(p => `
      <div class="product-card" onclick="app.addToCart(${p.id})">
        <img class="product-img" src="${p.img}" alt="${p.name}" />
        <div class="product-info">
          <div class="product-title">${p.name}</div>
          <div class="product-desc">${p.desc}</div>
        </div>
        <div class="product-footer">
          <div class="product-price">${p.price.toFixed(2)} ج.م</div>
          <div class="add-btn-icon"><i class="fas fa-plus"></i></div>
        </div>
      </div>
    `).join('');
  }

  addToCart(productId) {
    const product = db.getProducts().find(p => p.id === productId);
    if (!product) return;

    const existing = this.cart.find(item => item.id === productId);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ ...product, qty: 1 });
    }
    this.renderCart();
    showToast(`تمت إضافة ${product.name}`, 'success');
  }

  updateQty(productId, delta) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.removeFromCart(productId);
    } else {
      this.renderCart();
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.id !== productId);
    this.renderCart();
  }

  clearCart() {
    this.cart = [];
    this.discountAmount = 0;
    this.renderCart();
  }

  renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); margin-top: 40px;">
          <i class="fas fa-shopping-basket" style="font-size: 36px; margin-bottom: 10px;"></i>
          <div>السلة فارغة حالياً</div>
        </div>
      `;
      this.updateCartTotals(0, 0, 0);
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-top">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">${(item.price * item.qty).toFixed(2)} ج.م</span>
        </div>
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="qty-btn" onclick="app.updateQty(${item.id}, -1)">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="app.updateQty(${item.id}, 1)">+</button>
          </div>
          <i class="fas fa-trash item-delete-btn" onclick="app.removeFromCart(${item.id})"></i>
        </div>
      </div>
    `).join('');

    const settings = db.getSettings();
    const subtotal = this.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + tax - this.discountAmount;

    this.updateCartTotals(subtotal, tax, total);
  }

  updateCartTotals(subtotal, tax, total) {
    document.getElementById('cart-subtotal').innerText = `${subtotal.toFixed(2)} ج.م`;
    document.getElementById('cart-tax').innerText = `${tax.toFixed(2)} ج.م`;
    document.getElementById('cart-total').innerText = `${Math.max(0, total).toFixed(2)} ج.م`;
  }

  openCheckoutModal() {
    if (this.cart.length === 0) {
      showToast('يرجى إضافة أصناف إلى السلة أولاً', 'warning');
      return;
    }
    const settings = db.getSettings();
    const subtotal = this.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + tax - this.discountAmount;

    document.getElementById('checkout-total-val').innerText = `${total.toFixed(2)} ج.م`;
    document.getElementById('modal-paid-input').value = Math.ceil(total);
    this.calculateChange();

    document.getElementById('checkout-modal').classList.add('active');
  }

  closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('active');
  }

  setOrderType(type) {
    this.orderType = type;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');
    
    document.getElementById('table-no-group').style.display = type === 'dinein' ? 'block' : 'none';
    document.getElementById('delivery-info-group').style.display = type === 'delivery' ? 'block' : 'none';
  }

  setPaymentMethod(method) {
    this.paymentMethod = method;
    document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.pay-btn[data-pay="${method}"]`).classList.add('active');
  }

  calculateChange() {
    const settings = db.getSettings();
    const subtotal = this.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + tax - this.discountAmount;
    const paid = parseFloat(document.getElementById('modal-paid-input').value) || 0;
    const change = Math.max(0, paid - total);
    document.getElementById('checkout-change-val').innerText = `${change.toFixed(2)} ج.م`;
  }

  async confirmCheckoutAndPrint() {
    const settings = db.getSettings();
    const subtotal = this.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + tax - this.discountAmount;
    const paid = parseFloat(document.getElementById('modal-paid-input').value) || total;

    const orderTypeMap = { takeaway: 'تيك أواي', dinein: 'صالة', delivery: 'توصيل' };
    const payMap = { cash: 'كاش', card: 'فيزا / بطاقة', wallet: 'محفظة إلكترونية' };

    const order = {
      id: Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleString('ar-EG'),
      cashierName: this.currentUser.name,
      orderType: this.orderType,
      orderTypeAr: orderTypeMap[this.orderType],
      paymentMethod: this.paymentMethod,
      paymentMethodAr: payMap[this.paymentMethod],
      items: [...this.cart],
      subtotal: subtotal,
      tax: tax,
      discount: this.discountAmount,
      total: total,
      paidAmount: paid,
      changeAmount: Math.max(0, paid - total),
      status: 'new',
      notes: document.getElementById('order-notes-input').value || ''
    };

    // Save to DB
    db.saveOrder(order);

    // Play Sound & Print Receipts
    kdsManager.playOrderAlertSound();
    await printService.printOrderReceipt(order);
    await printService.printKitchenTicket(order);

    this.closeCheckoutModal();
    this.clearCart();
    showToast(`تم حفظ وتأكيد الطلب رقم #${order.id} بنجاح!`, 'success');
  }

  updateStatus(orderId, newStatus) {
    db.updateOrderStatus(orderId, newStatus);
    kdsManager.renderKDSGrid(document.getElementById('kds-grid-container'));
    if (document.getElementById('active-orders-screen').classList.contains('active')) {
      this.renderActiveOrders();
    }
  }

  renderActiveOrders() {
    const container = document.getElementById('active-orders-grid');
    if (!container) return;
    const orders = db.getOrders();
    container.innerHTML = orders.map(o => `
      <div class="order-card ${o.status}">
        <div class="card-header-banner">
          <span class="order-id">#${o.id} - ${o.orderTypeAr}</span>
          <span>${o.date}</span>
        </div>
        <div class="card-body-items">
          <div><strong>الحالة:</strong> ${o.status === 'new' ? 'جديد 🟡' : (o.status === 'cooking' ? 'قيد التحضير 🔵' : 'جاهز 🟢')}</div>
          <div><strong>الإجمالي:</strong> ${o.total.toFixed(2)} ج.م</div>
          <div><strong>طريقة الدفع:</strong> ${o.paymentMethodAr}</div>
        </div>
        <div class="card-footer-actions">
          <button class="btn btn-secondary" onclick="printService.printOrderReceipt(db.getOrders().find(x=>x.id===${o.id}))">🖨️ إعادة طباعة الفاتورة</button>
        </div>
      </div>
    `).join('');
  }

  loadSettingsScreen() {
    const s = db.getSettings();
    document.getElementById('setting-store-name').value = s.storeName;
    document.getElementById('setting-store-phone').value = s.storePhone;
    document.getElementById('setting-printer-name').value = s.selectedPrinter;
  }

  saveSettingsFromForm() {
    const s = db.getSettings();
    s.storeName = document.getElementById('setting-store-name').value;
    s.storePhone = document.getElementById('setting-store-phone').value;
    s.selectedPrinter = document.getElementById('setting-printer-name').value;
    db.saveSettings(s);
    showToast('تم حفظ الإعدادات بنجاح', 'success');
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

const app = new AppEngine();
