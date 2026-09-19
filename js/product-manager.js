/* ==========================================================================
   TADBEER POS - PRODUCTS & CATEGORIES EDITOR MANAGER
   Allows User / Owner to Add, Edit, Delete Products & Prices Directly
   ========================================================================== */

class ProductManager {
  renderProductAdminScreen(container) {
    if (!container) return;
    const products = db.getProducts();
    const categories = db.getCategories();

    container.innerHTML = `
      <div style="padding: 24px; overflow-y: auto; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: var(--secondary); font-weight: 800;"><i class="fas fa-box-open"></i> إدارة الأصناف وقائمة الطعام والأسعار</h2>
          <button class="btn btn-primary" onclick="productManager.openProductModal()"><i class="fas fa-plus"></i> إضافة صنف جديد</button>
        </div>

        <div style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>صورة</th>
                <th>اسم الصنف</th>
                <th>القسم</th>
                <th>السعر</th>
                <th>الوصف</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => {
                let cat = categories.find(c => c.id === p.categoryId);
                return `
                  <tr>
                    <td><img src="${p.img}" class="product-img-thumb" alt="${p.name}"></td>
                    <td style="font-weight:700;">${p.name}</td>
                    <td><span style="background:var(--bg-input); padding:4px 8px; border-radius:6px; font-size:12px;">${cat ? cat.name : p.categoryId}</span></td>
                    <td style="font-family:var(--font-mono); font-weight:700; color:var(--gold);">${p.price.toFixed(2)} ج.م</td>
                    <td style="color:var(--text-muted); font-size:13px;">${p.desc}</td>
                    <td>
                      <button class="btn btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="productManager.openProductModal(${p.id})"><i class="fas fa-edit"></i> تعديل</button>
                      <button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="productManager.deleteProduct(${p.id})"><i class="fas fa-trash"></i> حذف</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  openProductModal(productId = null) {
    const categories = db.getCategories();
    const selectEl = document.getElementById('prod-modal-cat');
    selectEl.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (productId) {
      const p = db.getProducts().find(x => x.id === productId);
      if (p) {
        document.getElementById('prod-modal-id').value = p.id;
        document.getElementById('prod-modal-name').value = p.name;
        document.getElementById('prod-modal-price').value = p.price;
        document.getElementById('prod-modal-desc').value = p.desc;
        document.getElementById('prod-modal-img').value = p.img;
        selectEl.value = p.categoryId;
        document.getElementById('product-modal-title').innerText = 'تعديل صنف ورقم السعر';
      }
    } else {
      document.getElementById('prod-modal-id').value = '';
      document.getElementById('prod-modal-name').value = '';
      document.getElementById('prod-modal-price').value = '';
      document.getElementById('prod-modal-desc').value = '';
      document.getElementById('prod-modal-img').value = 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=300&q=80';
      document.getElementById('product-modal-title').innerText = 'إضافة صنف جديد لقائمة الطعام';
    }

    document.getElementById('product-admin-modal').classList.add('active');
  }

  saveProductFromModal() {
    const id = document.getElementById('prod-modal-id').value;
    const name = document.getElementById('prod-modal-name').value;
    const price = parseFloat(document.getElementById('prod-modal-price').value) || 0;
    const desc = document.getElementById('prod-modal-desc').value;
    const img = document.getElementById('prod-modal-img').value;
    const categoryId = document.getElementById('prod-modal-cat').value;

    if (!name || price <= 0) {
      showToast('يرجى إدخال اسم الصنف والسعر بشكل صحيح', 'warning');
      return;
    }

    db.saveProduct({
      id: id ? parseInt(id) : Date.now(),
      name: name,
      price: price,
      desc: desc,
      img: img || 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=300&q=80',
      categoryId: categoryId
    });

    document.getElementById('product-admin-modal').classList.remove('active');
    showToast('تم حفظ الاصنف وتعديل السعر بنجاح', 'success');

    app.renderProducts();
    this.renderProductAdminScreen(document.getElementById('products-admin-screen'));
  }

  deleteProduct(id) {
    if (confirm('هل أنت تأكيد من حذف هذا الصنف من قائمة الطعام؟')) {
      db.deleteProduct(id);
      showToast('تم حذف الصنف بنجاح', 'info');
      app.renderProducts();
      this.renderProductAdminScreen(document.getElementById('products-admin-screen'));
    }
  }
}

const productManager = new ProductManager();
