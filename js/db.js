/* ==========================================================================
   TADBEER POS - LOCAL DATABASE & SEED DATA MANAGEMENT
   Handles offline data storage, local state, and initial mock data
   ========================================================================== */

const DEFAULT_SETTINGS = {
  storeName: 'مطعم أبو العز - شاورما وكريب',
  storePhone: '01012345678 - 01287654321',
  storeAddress: 'شارع الجامعة - بجوار المحطة - القاهرة',
  taxRate: 14,
  currency: 'ج.م',
  selectedPrinter: 'POS-80 Printer',
  paperSize: '80mm',
  printCopies: 1,
  autoPrintCheckout: true,
  autoOpenCashDrawer: true,
  printKitchenTicket: true,
  receiptFooter: 'شكراً لزيارتكم - نتشرف بحضوركم دائماً',
  kitchenPrinter: 'Kitchen Thermal Printer'
};

const INITIAL_CATEGORIES = [
  { id: 'shawarma', name: 'شاورما', icon: 'fa-dumpster-fire' },
  { id: 'crepe', name: 'كريب', icon: 'fa-stroopwafel' },
  { id: 'burger', name: 'برجر', icon: 'fa-hamburger' },
  { id: 'sandwiches', name: 'ساندويتشات', icon: 'fa-bread-slice' },
  { id: 'appetizers', name: 'مقبلات وشيبس', icon: 'fa-french-fries' },
  { id: 'drinks', name: 'مشروبات', icon: 'fa-wine-glass-alt' },
  { id: 'desserts', name: 'حلويات', icon: 'fa-ice-cream' }
];

const INITIAL_PRODUCTS = [
  { id: 101, categoryId: 'shawarma', name: 'ساندويتش شاورما فراخ صاج', price: 65.00, desc: 'شاورما فراخ مع ثومية ومخلل', img: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=300&q=80' },
  { id: 102, categoryId: 'shawarma', name: 'ساندويتش شاورما لحمة صاج', price: 75.00, desc: 'شاورما لحمة بلدي مع طحينة وبقدونس', img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&q=80' },
  { id: 103, categoryId: 'shawarma', name: 'فتة شاورما عربي مشكل', price: 120.00, desc: 'أرز بسمتي + شاورما فراخ ولحمة + خبز محمص', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' },
  { id: 104, categoryId: 'shawarma', name: 'وجبة عربي شاورما دبل', price: 110.00, desc: '2 ساندويتش تقطيع عربي + بطاطس + ثومية', img: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=300&q=80' },
  
  { id: 201, categoryId: 'crepe', name: 'كريب نوتيلا بالموز', price: 55.00, desc: 'شوكولاتة نوتيلا + قطع موز طازجة', img: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=300&q=80' },
  { id: 202, categoryId: 'crepe', name: 'كريب كرانشي فراخ', price: 70.00, desc: 'قطع فراخ مقرمشة + جبنة موتزاريلا + صوص شيدر', img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&q=80' },
  { id: 203, categoryId: 'crepe', name: 'كريب ميكس أجبان', price: 50.00, desc: 'موتزاريلا + شيدر + رومي + زيتون + فلفل', img: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=300&q=80' },
  { id: 204, categoryId: 'crepe', name: 'كريب زنجر سوبر ديلوكس', price: 80.00, desc: 'قطع زنجر حار + موتزاريلا + صوص باربيكيو', img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&q=80' },

  { id: 301, categoryId: 'burger', name: 'برجر كلاسيك دبل', price: 85.00, desc: 'قطعتين لحم 200جم + خس + طماطم + صوص خاص', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
  { id: 302, categoryId: 'burger', name: 'تشيز برجر سينجل', price: 65.00, desc: 'قطعة لحم بلدي + جبنة شيدر سائلة', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80' },

  { id: 401, categoryId: 'sandwiches', name: 'ساندويتش كبدة إسكندراني', price: 35.00, desc: 'كبدة بلدي بالثوم والفلفل الحار', img: 'https://images.unsplash.com/photo-1603064752734-4c48fea5ba57?w=300&q=80' },
  { id: 402, categoryId: 'sandwiches', name: 'ساندويتش سجق شرقي', price: 40.00, desc: 'سجق مع خلطة الطماطم والفلفل', img: 'https://images.unsplash.com/photo-1603064752734-4c48fea5ba57?w=300&q=80' },

  { id: 501, categoryId: 'appetizers', name: 'باكيت بطاطس فارم فريتس', price: 25.00, desc: 'بطاطس ذهبية مقرمشة مع بهارات POS', img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80' },
  { id: 502, categoryId: 'appetizers', name: 'طبق أصابع موتزاريلا', price: 45.00, desc: '4 قطع موتزاريلا ستيكس مقرمشة', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
  { id: 503, categoryId: 'appetizers', name: 'علبة ثومية كبيرة', price: 15.00, desc: 'ثومية شامية أصيلة', img: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300&q=80' },

  { id: 601, categoryId: 'drinks', name: 'بيبسي كانز 330مل', price: 20.00, desc: 'مشروب غازي بارد', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
  { id: 602, categoryId: 'drinks', name: 'عصير مانجو طازج', price: 30.00, desc: 'عصير مانجو طبيعي 100%', img: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300&q=80' },
  { id: 603, categoryId: 'drinks', name: 'زجاجة مياه معدنية', price: 10.00, desc: 'مياه طبيعية 500مل', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80' }
];

class DBService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem('pos_settings')) {
      localStorage.setItem('pos_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem('pos_categories')) {
      localStorage.setItem('pos_categories', JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem('pos_products')) {
      localStorage.setItem('pos_products', JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem('pos_orders')) {
      localStorage.setItem('pos_orders', JSON.stringify([]));
    }
  }

  getSettings() {
    return JSON.parse(localStorage.getItem('pos_settings'));
  }

  saveSettings(settings) {
    localStorage.setItem('pos_settings', JSON.stringify(settings));
  }

  getCategories() {
    return JSON.parse(localStorage.getItem('pos_categories'));
  }

  getProducts() {
    return JSON.parse(localStorage.getItem('pos_products'));
  }

  saveProduct(product) {
    let products = this.getProducts();
    let index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      product.id = Date.now();
      products.push(product);
    }
    localStorage.setItem('pos_products', JSON.stringify(products));
  }

  deleteProduct(id) {
    let products = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem('pos_products', JSON.stringify(products));
  }

  getOrders() {
    return JSON.parse(localStorage.getItem('pos_orders'));
  }

  saveOrder(order) {
    let orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem('pos_orders', JSON.stringify(orders));
    return order;
  }

  updateOrderStatus(orderId, status) {
    let orders = this.getOrders();
    let order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      localStorage.setItem('pos_orders', JSON.stringify(orders));
    }
  }
}

const db = new DBService();
