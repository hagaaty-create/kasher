/* ==========================================================================
   TADBEER POS - KITCHEN DISPLAY SYSTEM (KDS) & SOUND ALERTS
   ========================================================================== */

class KDSManager {
  constructor() {
    this.audioContext = null;
  }

  playOrderAlertSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioContext.currentTime); // Note A5
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio playback prevented');
    }
  }

  renderKDSGrid(ordersContainer) {
    const orders = db.getOrders().filter(o => o.status !== 'delivered');
    if (!ordersContainer) return;

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">
          <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
          <h2>لا يوجد طلبات نشطة في المطبخ حالياً</h2>
        </div>
      `;
      return;
    }

    ordersContainer.innerHTML = orders.map(o => {
      let statusClass = o.status === 'new' ? 'new' : (o.status === 'cooking' ? 'cooking' : 'ready');
      let statusText = o.status === 'new' ? 'جديد 🟡' : (o.status === 'cooking' ? 'قيد التحضير 🔵' : 'جاهز 🟢');

      let itemsHtml = o.items.map(i => `
        <div class="kds-item-row">
          <span>${i.name}</span>
          <span class="kds-item-qty">x${i.qty}</span>
        </div>
      `).join('');

      return `
        <div class="kds-card ${statusClass}">
          <div class="card-header-banner">
            <span class="order-id">#${o.id} (${o.orderTypeAr})</span>
            <span class="order-timer" data-time="${o.createdAt}">${this.calculateElapsedTime(o.createdAt)}</span>
          </div>
          <div class="card-body-items">
            ${itemsHtml}
            ${o.notes ? `<div style="margin-top: 10px; color: var(--warning); font-size:13px;"><strong>ملاحظات:</strong> ${o.notes}</div>` : ''}
          </div>
          <div class="card-footer-actions">
            ${o.status === 'new' ? `
              <button class="btn btn-primary" style="flex:1;" onclick="app.updateStatus(${o.id}, 'cooking')">بدء التحضير 🍳</button>
            ` : ''}
            ${o.status === 'cooking' ? `
              <button class="btn btn-success" style="flex:1;" onclick="app.updateStatus(${o.id}, 'ready')">جاهز للتسليم 🟢</button>
            ` : ''}
            ${o.status === 'ready' ? `
              <button class="btn btn-gold" style="flex:1;" onclick="app.updateStatus(${o.id}, 'delivered')">تم التسليم ✅</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  calculateElapsedTime(createdAt) {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}

const kdsManager = new KDSManager();
