/* ==========================================================================
   TADBEER POS - EXTENDED DB SERVICE FOR ACCOUNTING & SHIFTS
   ========================================================================== */

// Enhance DB initial defaults
const INITIAL_SHIFT = {
  id: 1001,
  openedAt: new Date().toLocaleString('ar-EG'),
  closedAt: null,
  cashierName: 'أحمد كاشير',
  openingCash: 500.00, // المبلغ الافتتاحي بالدرج
  status: 'open'
};

if (!localStorage.getItem('pos_active_shift')) {
  localStorage.setItem('pos_active_shift', JSON.stringify(INITIAL_SHIFT));
}

if (!localStorage.getItem('pos_cash_movements')) {
  localStorage.setItem('pos_cash_movements', JSON.stringify([]));
}

if (!localStorage.getItem('pos_shifts_history')) {
  localStorage.setItem('pos_shifts_history', JSON.stringify([]));
}

// Extend DBService Prototype
DBService.prototype.getActiveShift = function() {
  return JSON.parse(localStorage.getItem('pos_active_shift'));
};

DBService.prototype.saveActiveShift = function(shift) {
  localStorage.setItem('pos_active_shift', JSON.stringify(shift));
};

DBService.prototype.getCashMovements = function() {
  return JSON.parse(localStorage.getItem('pos_cash_movements'));
};

DBService.prototype.addCashMovement = function(movement) {
  let list = this.getCashMovements();
  movement.id = Date.now();
  movement.date = new Date().toLocaleString('ar-EG');
  list.unshift(movement);
  localStorage.setItem('pos_cash_movements', JSON.stringify(list));
};

DBService.prototype.closeShift = function(closingActualCash, notes) {
  let shift = this.getActiveShift();
  if (!shift) return null;

  const orders = this.getOrders();
  const cashSales = orders.reduce((acc, o) => o.paymentMethod === 'cash' ? acc + o.total : acc, 0);
  const cardSales = orders.reduce((acc, o) => o.paymentMethod === 'card' ? acc + o.total : acc, 0);
  const walletSales = orders.reduce((acc, o) => o.paymentMethod === 'wallet' ? acc + o.total : acc, 0);

  const movements = this.getCashMovements();
  const cashInTotal = movements.reduce((acc, m) => m.type === 'in' ? acc + m.amount : acc, 0);
  const cashOutTotal = movements.reduce((acc, m) => m.type === 'out' ? acc + m.amount : acc, 0);

  const expectedCashInDrawer = shift.openingCash + cashSales + cashInTotal - cashOutTotal;
  const difference = closingActualCash - expectedCashInDrawer;

  const shiftReport = {
    ...shift,
    closedAt: new Date().toLocaleString('ar-EG'),
    status: 'closed',
    totalOrders: orders.length,
    cashSales: cashSales,
    cardSales: cardSales,
    walletSales: walletSales,
    totalSales: cashSales + cardSales + walletSales,
    cashInTotal: cashInTotal,
    cashOutTotal: cashOutTotal,
    expectedCash: expectedCashInDrawer,
    actualCash: closingActualCash,
    difference: difference,
    notes: notes
  };

  // Save to history and open a new shift
  let history = JSON.parse(localStorage.getItem('pos_shifts_history')) || [];
  history.unshift(shiftReport);
  localStorage.setItem('pos_shifts_history', JSON.stringify(history));

  // Reset shift & clear orders for new shift
  const newShift = {
    id: shift.id + 1,
    openedAt: new Date().toLocaleString('ar-EG'),
    closedAt: null,
    cashierName: shift.cashierName,
    openingCash: closingActualCash, // بداية جديدة بمبلغ الدرج
    status: 'open'
  };
  this.saveActiveShift(newShift);
  localStorage.setItem('pos_cash_movements', JSON.stringify([]));

  return shiftReport;
};
