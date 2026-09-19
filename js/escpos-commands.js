/* ==========================================================================
   TADBEER POS - ESC/POS COMMAND BUILDER
   Standard Binary Command Constants & Helpers for 80mm Thermal Receipt Printers
   ========================================================================== */

const ESCPOS = {
  // Initialization
  INIT: '\x1B\x40',
  
  // Alignment
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  
  // Font Styles & Sizes
  FONT_NORMAL: '\x1B\x21\x00',
  FONT_BOLDER: '\x1B\x45\x01',
  FONT_BOLD_OFF: '\x1B\x45\x00',
  FONT_DOUBLE_WIDTH: '\x1B\x21\x10',
  FONT_DOUBLE_HEIGHT: '\x1B\x21\x20',
  FONT_DOUBLE_BOTH: '\x1B\x21\x30',
  
  // Cash Drawer & Paper Cut
  PAPER_FULL_CUT: '\x1D\x56\x00',
  PAPER_PARTIAL_CUT: '\x1D\x56\x01',
  OPEN_CASH_DRAWER: '\x1B\x70\x00\x19\xFA',
  
  // Audio Alert (Buzzer)
  BEEP_3_TIMES: '\x1B\x42\x03\x02',
  
  // Line Spacing
  LINE_FEED: '\x0A'
};

/**
 * Generate RAW ESC/POS Hex / Binary Buffer String for Order Receipt
 */
function buildEscPosReceipt(order, settings) {
  let cmd = '';
  
  // 1. Initialize
  cmd += ESCPOS.INIT;
  
  // 2. Open Cash Drawer if Cash Payment
  if (order.paymentMethod === 'cash' && settings.autoOpenCashDrawer) {
    cmd += ESCPOS.OPEN_CASH_DRAWER;
  }
  
  // 3. Header Text
  cmd += ESCPOS.ALIGN_CENTER;
  cmd += ESCPOS.FONT_DOUBLE_BOTH + ESCPOS.FONT_BOLDER;
  cmd += settings.storeName + ESCPOS.LINE_FEED;
  cmd += ESCPOS.FONT_NORMAL + ESCPOS.FONT_BOLD_OFF;
  cmd += (settings.storeAddress || 'القاهرة - مصر') + ESCPOS.LINE_FEED;
  cmd += 'هاتف: ' + (settings.storePhone || '01000000000') + ESCPOS.LINE_FEED;
  cmd += '==========================================' + ESCPOS.LINE_FEED;
  
  // 4. Order Info
  cmd += ESCPOS.ALIGN_RIGHT;
  cmd += `رقم الطلب: #${order.id}` + ESCPOS.LINE_FEED;
  cmd += `التاريخ: ${order.date}` + ESCPOS.LINE_FEED;
  cmd += `الكاشير: ${order.cashierName || 'أحمد'}` + ESCPOS.LINE_FEED;
  cmd += `نوع الطلب: ${order.orderTypeAr}` + ESCPOS.LINE_FEED;
  cmd += '------------------------------------------' + ESCPOS.LINE_FEED;
  
  // 5. Table Header
  cmd += 'الصنف                   الكمية   السعر' + ESCPOS.LINE_FEED;
  cmd += '------------------------------------------' + ESCPOS.LINE_FEED;
  
  // 6. Items
  order.items.forEach(item => {
    let name = item.name.padEnd(22, ' ');
    let qty = String(item.qty).padStart(4, ' ');
    let price = (item.price * item.qty).toFixed(2).padStart(8, ' ');
    cmd += `${name} ${qty} ${price}` + ESCPOS.LINE_FEED;
  });
  
  cmd += '==========================================' + ESCPOS.LINE_FEED;
  
  // 7. Totals
  cmd += ESCPOS.ALIGN_LEFT;
  cmd += `المجموع الفرعي: ${order.subtotal.toFixed(2)} ج.م` + ESCPOS.LINE_FEED;
  if (order.tax > 0) cmd += `الضريبة (${settings.taxRate}%): ${order.tax.toFixed(2)} ج.م` + ESCPOS.LINE_FEED;
  if (order.discount > 0) cmd += `الخصم: ${order.discount.toFixed(2)} ج.م` + ESCPOS.LINE_FEED;
  
  cmd += ESCPOS.FONT_DOUBLE_HEIGHT + ESCPOS.FONT_BOLDER;
  cmd += `الإجمالي: ${order.total.toFixed(2)} ج.م` + ESCPOS.LINE_FEED;
  cmd += ESCPOS.FONT_NORMAL + ESCPOS.FONT_BOLD_OFF;
  cmd += '==========================================' + ESCPOS.LINE_FEED;
  
  // 8. Payment info
  cmd += `طريقة الدفع: ${order.paymentMethodAr}` + ESCPOS.LINE_FEED;
  cmd += `المدفوع: ${order.paidAmount.toFixed(2)} ج.م` + ESCPOS.LINE_FEED;
  cmd += `الباقي: ${order.changeAmount.toFixed(2)} ج.م` + ESCPOS.LINE_FEED;
  
  // 9. Footer
  cmd += ESCPOS.ALIGN_CENTER;
  cmd += '------------------------------------------' + ESCPOS.LINE_FEED;
  cmd += settings.receiptFooter || 'شكراً لزيارتكم - نتشرف بكم دائماً' + ESCPOS.LINE_FEED;
  cmd += 'تطوير: Tadbeer POS System' + ESCPOS.LINE_FEED;
  
  // 10. Cut Paper
  cmd += ESCPOS.LINE_FEED + ESCPOS.LINE_FEED + ESCPOS.LINE_FEED;
  cmd += ESCPOS.PAPER_FULL_CUT;
  
  return cmd;
}

/**
 * Generate Kitchen ESC/POS Command Ticket
 */
function buildEscPosKitchenTicket(order) {
  let cmd = '';
  cmd += ESCPOS.INIT + ESCPOS.BEEP_3_TIMES;
  cmd += ESCPOS.ALIGN_CENTER + ESCPOS.FONT_DOUBLE_BOTH + ESCPOS.FONT_BOLDER;
  cmd += '🔔 طلب مطبخ جديد 🔔' + ESCPOS.LINE_FEED;
  cmd += `رقم الطلب: #${order.id}` + ESCPOS.LINE_FEED;
  cmd += ESCPOS.FONT_NORMAL + ESCPOS.FONT_BOLD_OFF;
  cmd += `الوقت: ${order.date}` + ESCPOS.LINE_FEED;
  cmd += `نوع الطلب: ${order.orderTypeAr}` + ESCPOS.LINE_FEED;
  cmd += '------------------------------------------' + ESCPOS.LINE_FEED;
  
  cmd += ESCPOS.ALIGN_RIGHT + ESCPOS.FONT_DOUBLE_HEIGHT;
  order.items.forEach(item => {
    cmd += `${item.qty} x ${item.name}` + ESCPOS.LINE_FEED;
  });
  
  if (order.notes) {
    cmd += ESCPOS.FONT_NORMAL;
    cmd += '------------------------------------------' + ESCPOS.LINE_FEED;
    cmd += `ملاحظات: ${order.notes}` + ESCPOS.LINE_FEED;
  }
  
  cmd += ESCPOS.LINE_FEED + ESCPOS.LINE_FEED;
  cmd += ESCPOS.PAPER_FULL_CUT;
  
  return cmd;
}
