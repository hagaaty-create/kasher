/* ==========================================================================
   TADBEER POS - ADMIN FINANCIAL DASHBOARD & ACCOUNTING MONITOR
   Replaces old Kitchen screen with full financial filter system (Daily/Monthly)
   ========================================================================== */

class AdminFinancialDashboard {
  renderAdminDashboard(container) {
    if (!container) return;

    const orders = db.getOrders();
    const movements = db.getCashMovements();
    const shiftHistory = JSON.parse(localStorage.getItem('pos_shifts_history')) || [];

    // Calculate totals
    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const totalExpenses = movements.reduce((acc, m) => m.type === 'out' ? acc + m.amount : acc, 0);
    const totalDeposits = movements.reduce((acc, m) => m.type === 'in' ? acc + m.amount : acc, 0);
    const netProfit = totalRevenue + totalDeposits - totalExpenses;

    container.innerHTML = `
      <div style="padding: 24px; overflow-y: auto; width: 100%;">
        
        <!-- Header & Filters -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="color: var(--secondary); font-weight: 800; font-size: 24px;"><i class="fas fa-chart-pie"></i> لوحة الإدارة والمالية الشاملة</h2>
            <div style="color: var(--text-muted); font-size: 14px;">متابعة المصروفات والداخل والخارج والأرباح (يومي / شهري)</div>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <select id="admin-filter-period" class="form-control" style="width: 160px;" onchange="adminDashboard.applyFilter(this.value)">
              <option value="all">كل الأوقات</option>
              <option value="today">مبيعات اليوم فقط</option>
              <option value="month">مبيعات الشهر الحالي</option>
            </select>
            <button class="btn btn-primary" onclick="reportsManager.exportCSV()"><i class="fas fa-download"></i> تصدير البيانات</button>
          </div>
        </div>

        <!-- 4 Financial Summary KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px;">
          
          <div style="background: var(--bg-card); padding: 20px; border-radius: 14px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 13px; font-weight: 700;">إجمالي الدخل / المبيعات 📈</div>
            <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 900; color: var(--success); margin-top: 8px;" id="admin-kpi-income">
              ${totalRevenue.toFixed(2)} ج.م
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">عدد الفواتير: ${orders.length}</div>
          </div>

          <div style="background: var(--bg-card); padding: 20px; border-radius: 14px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 13px; font-weight: 700;">إجمالي المصروفات والنثريات 📉</div>
            <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 900; color: var(--danger); margin-top: 8px;" id="admin-kpi-expense">
              ${totalExpenses.toFixed(2)} ج.م
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">سحب من الدرج والمشتروات</div>
          </div>

          <div style="background: var(--bg-card); padding: 20px; border-radius: 14px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 13px; font-weight: 700;">إيداعات إضافية للدرج 💵</div>
            <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 900; color: var(--gold); margin-top: 8px;" id="admin-kpi-deposits">
              ${totalDeposits.toFixed(2)} ج.م
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">فكة ومبالغ مضافة</div>
          </div>

          <div style="background: var(--bg-card); padding: 20px; border-radius: 14px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 13px; font-weight: 700;">صافي الأرباح والصافي النهائي 💎</div>
            <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 900; color: ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}; margin-top: 8px;" id="admin-kpi-net">
              ${netProfit.toFixed(2)} ج.م
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">(الدخل + الإيداع - المصروفات)</div>
          </div>

        </div>

        <!-- Comprehensive Financial Audit Table -->
        <div style="background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border-color); overflow: hidden; margin-bottom: 24px;">
          <div style="padding: 16px; border-bottom: 1px solid var(--border-color); font-weight: 800; font-size: 16px; display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fas fa-list"></i> سجل العمليات والمصروفات بالتفصيل (داخل / خارج)</span>
          </div>

          <table class="admin-table">
            <thead>
              <tr>
                <th>التاريخ والوقت</th>
                <th>نوع العملية</th>
                <th>البيان / النثريات / الطلب</th>
                <th>طريقة الدفع / المصدر</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody id="admin-table-body">
              ${this.buildFinancialRows(orders, movements)}
            </tbody>
          </table>
        </div>

        <!-- Closed Days & Shift Logs -->
        <div style="background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border-color); overflow: hidden;">
          <div style="padding: 16px; border-bottom: 1px solid var(--border-color); font-weight: 800; font-size: 16px;">
            <i class="fas fa-archive"></i> أرشيف إغلاق الأيام والورديات السابقة
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>رقم الوردية</th>
                <th>تاريخ الإغلاق</th>
                <th>مبيعات الوردية</th>
                <th>المتوقع بالدرج</th>
                <th>الفعلي (المسلم)</th>
                <th>الفرق / العجز</th>
              </tr>
            </thead>
            <tbody>
              ${shiftHistory.length === 0 ? '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">لا يوجد ورديات مغلقة سابقة في الأرشيف</td></tr>' : ''}
              ${shiftHistory.map(s => `
                <tr>
                  <td style="font-family:var(--font-mono); font-weight:700;">#${s.id}</td>
                  <td>${s.closedAt}</td>
                  <td style="font-family:var(--font-mono); color:var(--success); font-weight:700;">${(s.totalSales || 0).toFixed(2)} ج.م</td>
                  <td style="font-family:var(--font-mono);">${(s.expectedCash || 0).toFixed(2)} ج.م</td>
                  <td style="font-family:var(--font-mono); font-weight:800; color:var(--gold);">${(s.actualCash || 0).toFixed(2)} ج.م</td>
                  <td style="font-family:var(--font-mono); color:${(s.difference || 0) < 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:800;">
                    ${(s.difference || 0).toFixed(2)} ج.م
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;
  }

  buildFinancialRows(orders, movements) {
    let combined = [];

    orders.forEach(o => {
      combined.push({
        timestamp: new Date(o.createdAt).getTime(),
        date: o.date,
        type: 'مبيعات 🟢',
        badgeClass: 'badge-in',
        desc: `فاتورة طلب #${o.id} (${o.orderTypeAr})`,
        method: o.paymentMethodAr,
        amount: o.total,
        isExpense: false
      });
    });

    movements.forEach(m => {
      combined.push({
        timestamp: new Date(m.timestamp || Date.now()).getTime(),
        date: m.date,
        type: m.type === 'in' ? 'إيداع 🔵' : 'مصروف / سحب 🔴',
        badgeClass: m.type === 'in' ? 'badge-in' : 'badge-out',
        desc: m.reason,
        method: 'كاش بالدرج',
        amount: m.amount,
        isExpense: m.type === 'out'
      });
    });

    combined.sort((a, b) => b.timestamp - a.timestamp);

    if (combined.length === 0) {
      return '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">لا توجد حركات مالية مسجلة</td></tr>';
    }

    return combined.map(c => `
      <tr>
        <td>${c.date}</td>
        <td><span class="${c.badgeClass}">${c.type}</span></td>
        <td>${c.desc}</td>
        <td>${c.method}</td>
        <td style="font-family:var(--font-mono); font-weight:800; color:${c.isExpense ? 'var(--danger)' : 'var(--success)'};">
          ${c.isExpense ? '-' : '+'}${c.amount.toFixed(2)} ج.م
        </td>
      </tr>
    `).join('');
  }

  applyFilter(val) {
    let orders = db.getOrders();
    let movements = db.getCashMovements();
    const now = new Date();

    if (val === 'today') {
      const todayStr = now.toLocaleDateString('ar-EG');
      orders = orders.filter(o => new Date(o.createdAt).toLocaleDateString('ar-EG') === todayStr);
    } else if (val === 'month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      orders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }

    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const totalExpenses = movements.reduce((acc, m) => m.type === 'out' ? acc + m.amount : acc, 0);
    const totalDeposits = movements.reduce((acc, m) => m.type === 'in' ? acc + m.amount : acc, 0);
    const netProfit = totalRevenue + totalDeposits - totalExpenses;

    document.getElementById('admin-kpi-income').innerText = `${totalRevenue.toFixed(2)} ج.م`;
    document.getElementById('admin-kpi-expense').innerText = `${totalExpenses.toFixed(2)} ج.م`;
    document.getElementById('admin-kpi-deposits').innerText = `${totalDeposits.toFixed(2)} ج.م`;
    document.getElementById('admin-kpi-net').innerText = `${netProfit.toFixed(2)} ج.م`;

    document.getElementById('admin-table-body').innerHTML = this.buildFinancialRows(orders, movements);
  }
}

const adminDashboard = new AdminFinancialDashboard();
// Keep kdsManager mock sound function if needed by app engine
const kdsManager = {
  playOrderAlertSound: () => {}
};
