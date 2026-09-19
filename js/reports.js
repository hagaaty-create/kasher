/* ==========================================================================
   TADBEER POS - REPORTS & DASHBOARD MANAGER
   Handles Sales Data Analytics, Summary Cards & Data Exports
   ========================================================================== */

class ReportsManager {
  renderDashboard(container) {
    if (!container) return;
    const orders = db.getOrders();
    const todayStr = new Date().toLocaleDateString('ar-EG');

    const todayOrders = orders.filter(o => new Date(o.createdAt).toLocaleDateString('ar-EG') === todayStr);
    const totalSales = todayOrders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = todayOrders.length;
    const avgTicket = orderCount > 0 ? (totalSales / orderCount) : 0;

    container.innerHTML = `
      <div style="padding: 24px; overflow-y: auto; width: 100%;">
        <h2 style="margin-bottom: 20px; font-weight: 800; color: var(--secondary);">📊 لوحة التقارير والمبيعات</h2>
        
        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 13px; font-weight: 700;">مبيعات اليوم</div>
            <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 900; color: var(--success); margin-top: 6px;">${totalSales.toFixed(2)} ج.م</div>
          </div>
          <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 13px; font-weight: 700;">عدد طلبات اليوم</div>
            <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 900; color: var(--gold); margin-top: 6px;">${orderCount}</div>
          </div>
          <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 13px; font-weight: 700;">متوسط قيمة الفاتورة</div>
            <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 900; color: var(--secondary); margin-top: 6px;">${avgTicket.toFixed(2)} ج.م</div>
          </div>
        </div>

        <!-- Action Export Buttons -->
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <button class="btn btn-success" onclick="reportsManager.exportCSV()"><i class="fas fa-file-excel"></i> تصدير Excel (CSV)</button>
          <button class="btn btn-primary" onclick="reportsManager.printReport()"><i class="fas fa-print"></i> طباعة تقرير تقفيل وردية</button>
        </div>

        <!-- Orders Table -->
        <div style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden;">
          <div style="padding: 16px; border-bottom: 1px solid var(--border-color); font-weight: 800;">سجل العمليات اليومية</div>
          <table style="width: 100%; border-collapse: collapse; text-align: right;">
            <thead>
              <tr style="background: var(--bg-input); color: var(--text-muted); font-size: 13px;">
                <th style="padding: 12px;">رقم الطلب</th>
                <th style="padding: 12px;">التاريخ</th>
                <th style="padding: 12px;">النوع</th>
                <th style="padding: 12px;">طريقة الدفع</th>
                <th style="padding: 12px;">الإجمالي</th>
                <th style="padding: 12px;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px; font-family: var(--font-mono); font-weight: 700;">#${o.id}</td>
                  <td style="padding: 12px;">${o.date}</td>
                  <td style="padding: 12px;">${o.orderTypeAr}</td>
                  <td style="padding: 12px;">${o.paymentMethodAr}</td>
                  <td style="padding: 12px; font-family: var(--font-mono); font-weight: 700; color: var(--gold);">${o.total.toFixed(2)} ج.م</td>
                  <td style="padding: 12px;">
                    <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px;" onclick="printService.printOrderReceipt(db.getOrders().find(x=>x.id===${o.id}))">🖨️ إعادة طباعة</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  exportCSV() {
    const orders = db.getOrders();
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'رقم الطلب,التاريخ,نوع الطلب,طريقة الدفع,الإجمالي\n';

    orders.forEach(o => {
      csvContent += `${o.id},${o.date},${o.orderTypeAr},${o.paymentMethodAr},${o.total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `تقرير_مبيعات_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير تقرير المبيعات بنجاح', 'success');
  }

  printReport() {
    window.print();
  }
}

const reportsManager = new ReportsManager();
