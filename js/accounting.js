/* ==========================================================================
   TADBEER POS - SHIFT & CASH DRAWER ACCOUNTING MANAGER
   ========================================================================== */

class AccountingManager {
  renderShiftScreen(container) {
    if (!container) return;
    const shift = db.getActiveShift();
    const orders = db.getOrders();
    const movements = db.getCashMovements();

    const cashSales = orders.reduce((acc, o) => o.paymentMethod === 'cash' ? acc + o.total : acc, 0);
    const cardSales = orders.reduce((acc, o) => o.paymentMethod === 'card' ? acc + o.total : acc, 0);
    const walletSales = orders.reduce((acc, o) => o.paymentMethod === 'wallet' ? acc + o.total : acc, 0);

    const cashInTotal = movements.reduce((acc, m) => m.type === 'in' ? acc + m.amount : acc, 0);
    const cashOutTotal = movements.reduce((acc, m) => m.type === 'out' ? acc + m.amount : acc, 0);

    const expectedCashInDrawer = shift.openingCash + cashSales + cashInTotal - cashOutTotal;

    container.innerHTML = `
      <div style="padding: 24px; overflow-y: auto; width: 100%;">
        <h2 style="margin-bottom: 20px; color: var(--gold); font-weight: 800;"><i class="fas fa-vault"></i> تقفيل اليوم والوردية وحسابات الدرج (تصفير الدرج)</h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          
          <!-- Drawer Cash Summary -->
          <div class="drawer-summary-card">
            <h3 style="margin-bottom: 14px; color: var(--secondary);"><i class="fas fa-calculator"></i> حاسبة النقدية في الدرج الحالية</h3>
            <div class="drawer-metric">
              <span>رصيد أول الوردية (العهدة الافتتاحية):</span>
              <span class="drawer-metric-val" style="color: var(--gold);">${shift.openingCash.toFixed(2)} ج.م</span>
            </div>
            <div class="drawer-metric">
              <span>+ مبيعات كاش الوردية:</span>
              <span class="drawer-metric-val" style="color: var(--success);">${cashSales.toFixed(2)} ج.م</span>
            </div>
            <div class="drawer-metric">
              <span>+ إيداعات نقدية إضافية:</span>
              <span class="drawer-metric-val" style="color: var(--success);">${cashInTotal.toFixed(2)} ج.م</span>
            </div>
            <div class="drawer-metric">
              <span>- مسحوبات ونثريات مصروفة من الدرج:</span>
              <span class="drawer-metric-val" style="color: var(--danger);">${cashOutTotal.toFixed(2)} ج.م</span>
            </div>
            <div class="drawer-metric" style="font-size: 18px; font-weight: 900; background: var(--bg-input); padding: 12px; border-radius: 8px; margin-top: 10px;">
              <span>الرصيد المتوقع وجوده في الدرج:</span>
              <span class="drawer-metric-val" style="color: var(--success); font-size: 22px;">${expectedCashInDrawer.toFixed(2)} ج.م</span>
            </div>
          </div>

          <!-- Quick Cash Movement & Actions -->
          <div class="drawer-summary-card">
            <h3 style="margin-bottom: 14px; color: var(--secondary);"><i class="fas fa-hand-holding-usd"></i> حركة نقدية في الدرج (سحب / إيداع)</h3>
            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
              <button class="btn btn-success" style="flex:1;" onclick="accountingManager.openCashMovementModal('in')"><i class="fas fa-plus-circle"></i> إيداع كاش للدرج</button>
              <button class="btn btn-primary" style="flex:1;" onclick="accountingManager.openCashMovementModal('out')"><i class="fas fa-minus-circle"></i> سحب مصروفات/نثريات</button>
            </div>

            <div style="border-top: 1px dashed var(--border-color); padding-top: 14px; margin-top: 14px;">
              <h4 style="margin-bottom: 10px;">مبيعات الطرق الأخرى:</h4>
              <div class="drawer-metric"><span>مبيعات فيزا / بطاقات:</span><span class="drawer-metric-val">${cardSales.toFixed(2)} ج.م</span></div>
              <div class="drawer-metric"><span>مبيعات محفظة إلكترونية:</span><span class="drawer-metric-val">${walletSales.toFixed(2)} ج.م</span></div>
            </div>

            <button class="btn btn-gold" style="width:100%; margin-top: 20px; padding: 14px; font-size: 16px;" onclick="accountingManager.openCloseShiftModal(${expectedCashInDrawer})">
              🔒 تقفيل اليوم والوردية (تصفير الدرج كلياً)
            </button>
          </div>

        </div>

        <!-- Cash Movements Log Table -->
        <div style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden;">
          <div style="padding: 16px; border-bottom: 1px solid var(--border-color); font-weight: 800;">سجل حركة الدرج (سحب وإيداع)</div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>التاريخ والوقت</th>
                <th>نوع الحركة</th>
                <th>المبلغ</th>
                <th>البيان / السبب</th>
                <th>المسؤول</th>
              </tr>
            </thead>
            <tbody>
              ${movements.length === 0 ? '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">لا توجد حركة نقدية مضافة في هذه الوردية</td></tr>' : ''}
              ${movements.map(m => `
                <tr>
                  <td>${m.date}</td>
                  <td><span class="${m.type === 'in' ? 'badge-in' : 'badge-out'}">${m.type === 'in' ? 'إيداع 🟢' : 'سحب / مصروف 🔴'}</span></td>
                  <td style="font-family:var(--font-mono); font-weight:700;">${m.amount.toFixed(2)} ج.م</td>
                  <td>${m.reason}</td>
                  <td>${m.user || 'الكاشير'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;
  }

  openCashMovementModal(type) {
    document.getElementById('movement-type-val').value = type;
    document.getElementById('movement-modal-title').innerText = type === 'in' ? 'إيداع مالي في الدرج' : 'سحب مصروف / نثريات من الدرج';
    document.getElementById('cash-movement-modal').classList.add('active');
  }

  saveCashMovement() {
    const type = document.getElementById('movement-type-val').value;
    const amount = parseFloat(document.getElementById('movement-amount-input').value) || 0;
    const reason = document.getElementById('movement-reason-input').value;

    if (amount <= 0 || !reason) {
      showToast('يرجى إدخال مبلغ صحيح وبيان الحركة', 'warning');
      return;
    }

    db.addCashMovement({
      type: type,
      amount: amount,
      reason: reason,
      user: app.currentUser.name
    });

    document.getElementById('cash-movement-modal').classList.remove('active');
    document.getElementById('movement-amount-input').value = '';
    document.getElementById('movement-reason-input').value = '';

    showToast('تم تسجيل حركة الدرج بنجاح', 'success');
    this.renderShiftScreen(document.getElementById('shift-screen'));
  }

  openCloseShiftModal(expectedCash) {
    document.getElementById('close-expected-cash').innerText = `${expectedCash.toFixed(2)} ج.م`;
    document.getElementById('close-actual-cash-input').value = expectedCash;
    document.getElementById('close-shift-modal').classList.add('active');
  }

  confirmCloseShift() {
    const actualCash = parseFloat(document.getElementById('close-actual-cash-input').value) || 0;
    const notes = document.getElementById('close-shift-notes').value;

    const report = db.closeShiftAndZeroDrawer(actualCash, notes);

    document.getElementById('close-shift-modal').classList.remove('active');
    showToast(`تم تقفيل اليوم والوردية وتصفير الدرج بنجاح!`, 'success');
    
    // Print Shift Closing Receipt
    printService.printViaIframe(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><link rel="stylesheet" href="css/print.css"></head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <div class="store-title">تقرير تقفيل اليوم والوردية #${report.id}</div>
            <div class="store-sub">تاريخ الإغلاق: ${report.closedAt}</div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-info-row"><span>المبيعات النقدية:</span><span>${report.cashSales.toFixed(2)} ج.م</span></div>
          <div class="receipt-info-row"><span>الرصيد المتوقع:</span><span>${report.expectedCash.toFixed(2)} ج.م</span></div>
          <div class="receipt-info-row"><span>الفعلي بالدرج:</span><span>${report.actualCash.toFixed(2)} ج.م</span></div>
          <div class="receipt-info-row"><span>العجز / الزيادة:</span><span>${report.difference.toFixed(2)} ج.م</span></div>
          <div class="receipt-divider"></div>
          <div style="text-align:center; font-weight:bold;">تم تسليم الوردية وتصفير الدرج لليوم الجديد</div>
        </div>
      </body>
      </html>
    `);

    this.renderShiftScreen(document.getElementById('shift-screen'));
  }
}

const accountingManager = new AccountingManager();
