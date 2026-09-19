/* ==========================================================================
   TADBEER POS - PRINTING SERVICE MANAGER (QZ Tray & ESC/POS & Window Fallback)
   ========================================================================== */

class PrintService {
  constructor() {
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      if (typeof qz !== 'undefined') {
        await qz.websocket.connect({ host: 'localhost', port: 8181 });
        this.isConnected = true;
        console.log('✅ تم الاتصال بـ QZ Tray بنجاح على localhost:8181');
      }
    } catch (err) {
      this.isConnected = false;
      console.warn('⚠️ تعذر الاتصال بـ QZ Tray. سيتم استخدام آلية الطباعة المباشرة للويندوز:', err);
    }
  }

  async checkConnection() {
    try {
      if (typeof qz !== 'undefined' && !qz.websocket.isActive()) {
        await qz.websocket.connect({ host: 'localhost', port: 8181 });
        this.isConnected = true;
      }
    } catch (e) {
      this.isConnected = false;
    }
    return this.isConnected;
  }

  /**
   * Main Method to print order thermal receipt
   */
  async printOrderReceipt(order) {
    const settings = db.getSettings();
    const receiptHTML = this.generateReceiptHTML(order, settings);
    const rawEscPos = buildEscPosReceipt(order, settings);

    // Update Print Count on Order
    order.printCount = (order.printCount || 0) + 1;

    // Try printing via QZ Tray first
    if (this.isConnected && typeof qz !== 'undefined') {
      try {
        const config = qz.configs.create(settings.selectedPrinter);
        const data = [
          { type: 'raw', format: 'plain', data: rawEscPos }
        ];
        await qz.print(config, data);
        showToast('تمت الطباعة الحرارية عبر QZ Tray بنجاح', 'success');
        return true;
      } catch (err) {
        console.error('QZ Tray Print Failed, using Browser Fallback:', err);
      }
    }

    // Fallback: Silent Window Print iframe
    this.printViaIframe(receiptHTML);
    showToast('تمت أومر الطباعة الحرارية (Window Fallback)', 'success');
    return true;
  }

  /**
   * Main Method to print Kitchen Order Ticket (KOT)
   */
  async printKitchenTicket(order) {
    const settings = db.getSettings();
    if (!settings.printKitchenTicket) return;

    const kitchenHTML = this.generateKitchenHTML(order);
    const rawEscPos = buildEscPosKitchenTicket(order);

    if (this.isConnected && typeof qz !== 'undefined') {
      try {
        const config = qz.configs.create(settings.kitchenPrinter || settings.selectedPrinter);
        const data = [{ type: 'raw', format: 'plain', data: rawEscPos }];
        await qz.print(config, data);
        return true;
      } catch (err) {
        console.error('Kitchen QZ Print Error:', err);
      }
    }

    this.printViaIframe(kitchenHTML);
  }

  /**
   * Print Test Page
   */
  async testPrint() {
    const testOrder = {
      id: 9999,
      date: new Date().toLocaleString('ar-EG'),
      cashierName: 'تجربة كاشير',
      orderTypeAr: 'تيك أواي',
      paymentMethodAr: 'كاش',
      items: [
        { name: 'شاورما فراخ صاج', qty: 2, price: 65.00 },
        { name: 'كريب نوتيلا بالموز', qty: 1, price: 55.00 }
      ],
      subtotal: 185.00,
      tax: 25.90,
      discount: 0,
      total: 210.90,
      paidAmount: 250.00,
      changeAmount: 39.10
    };
    return await this.printOrderReceipt(testOrder);
  }

  /**
   * Generate Clean HTML for 80mm Receipt Template
   */
  generateReceiptHTML(order, settings) {
    let itemsRows = order.items.map(i => `
      <tr>
        <td class="name-col">${i.name}</td>
        <td class="qty-col">${i.qty}</td>
        <td class="price-col">${(i.price * i.qty).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة #${order.id}</title>
        <link rel="stylesheet" href="css/print.css">
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <div class="store-title">${settings.storeName}</div>
            <div class="store-sub">${settings.storeAddress}</div>
            <div class="store-sub">هاتف: ${settings.storePhone}</div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-info-row"><span>رقم الفاتورة:</span> <span>#${order.id}</span></div>
          <div class="receipt-info-row"><span>التاريخ والوقت:</span> <span>${order.date}</span></div>
          <div class="receipt-info-row"><span>الكاشير:</span> <span>${order.cashierName || 'أحمد'}</span></div>
          <div class="receipt-info-row"><span>نوع الطلب:</span> <span>${order.orderTypeAr}</span></div>
          ${order.tableNo ? `<div class="receipt-info-row"><span>رقم الطاولة:</span> <span>${order.tableNo}</span></div>` : ''}
          <div class="receipt-divider"></div>
          <table class="receipt-table">
            <thead>
              <tr>
                <th class="name-col">الصنف</th>
                <th class="qty-col">العدد</th>
                <th class="price-col">السعر</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div class="receipt-divider"></div>
          <div class="receipt-totals">
            <div class="total-row"><span>المجموع الفرعي:</span> <span>${order.subtotal.toFixed(2)} ج.م</span></div>
            ${order.tax > 0 ? `<div class="total-row"><span>الضريبة (${settings.taxRate}%):</span> <span>${order.tax.toFixed(2)} ج.م</span></div>` : ''}
            ${order.discount > 0 ? `<div class="total-row"><span>الخصم:</span> <span>${order.discount.toFixed(2)} ج.م</span></div>` : ''}
            <div class="total-row grand-total"><span>الإجمالي:</span> <span>${order.total.toFixed(2)} ج.م</span></div>
          </div>
          <div class="receipt-info-row"><span>طريقة الدفع:</span> <span>${order.paymentMethodAr}</span></div>
          <div class="receipt-info-row"><span>المدفوع:</span> <span>${order.paidAmount.toFixed(2)} ج.م</span></div>
          <div class="receipt-info-row"><span>الباقي:</span> <span>${order.changeAmount.toFixed(2)} ج.م</span></div>
          <div class="receipt-divider"></div>
          <div class="receipt-footer">
            <div>${settings.receiptFooter}</div>
            <div style="margin-top:4px; font-weight:bold;">Tadbeer POS thermal print</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateKitchenHTML(order) {
    let itemsRows = order.items.map(i => `
      <div class="kitchen-item-row">
        <span>${i.name}</span>
        <span>x ${i.qty}</span>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="css/print.css">
      </head>
      <body>
        <div class="receipt-container kitchen-ticket">
          <div class="title">🔔 طلب مطبخ - #${order.id}</div>
          <div class="receipt-divider"></div>
          <div class="receipt-info-row"><span>التاريخ:</span> <span>${order.date}</span></div>
          <div class="receipt-info-row"><span>النوع:</span> <span>${order.orderTypeAr}</span></div>
          <div class="receipt-divider"></div>
          ${itemsRows}
          ${order.notes ? `<div class="receipt-divider"></div><div><strong>ملاحظات:</strong> ${order.notes}</div>` : ''}
        </div>
      </body>
      </html>
    `;
  }

  printViaIframe(htmlContent) {
    let iframe = document.getElementById('print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  }
}

const printService = new PrintService();
