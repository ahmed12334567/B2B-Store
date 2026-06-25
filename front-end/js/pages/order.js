const toggle = document.getElementById("toggle");
const html = document.documentElement;

if (localStorage.getItem("theme") === "dark") {
  html.classList.add("dark");
  if (toggle) toggle.checked = true;
}

if (toggle) {
  toggle.addEventListener("change", function () {
    if (this.checked) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });
}

/* ============================================================
   DYNAMIC PRODUCT
   ============================================================ */
const productId = new URLSearchParams(window.location.search).get('id');
const API_BASE  = 'http://localhost:3000/api/products';

let UNIT_PRICE = 0; 
const VAT_RATE = 0.14; 
const VALID_COUPONS = {
  'SAVE10': 0.10,
  'SAVE20': 0.20,
  'AHMED5': 0.05,
}

let state = {
  qty:          1,
  shippingFee:  25.00,
  discountPct:  0,
  couponApplied: false,
};

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const qtyDisplay   = document.getElementById('qtyDisplay');
const itemPrice    = document.getElementById('itemPrice');
const subtotalEl   = document.getElementById('subtotal');
const shippingEl   = document.getElementById('shipping');
const discountRow  = document.getElementById('discountRow');
const discountAmt  = document.getElementById('discountAmt');
const vatAmtEl     = document.getElementById('vatAmt');
const totalPriceEl = document.getElementById('totalPrice');
const btnTotal     = document.getElementById('btnTotal');

/* ============================================================
   PRICE CALCULATION
   ============================================================ */
function formatUSD(num) {
  return num.toFixed(2) + '$';
}

function recalculate() {
  const subtotal  = UNIT_PRICE * state.qty;
  const discount  = subtotal * state.discountPct;
  const afterDisc = subtotal - discount;
  const vat       = afterDisc * VAT_RATE;
  const total     = afterDisc + vat + state.shippingFee;

  if(itemPrice) itemPrice.textContent       = formatUSD(UNIT_PRICE * state.qty);
  if(subtotalEl) subtotalEl.textContent     = formatUSD(subtotal);
  if(shippingEl) shippingEl.textContent     = state.shippingFee === 0 ? 'مجاناً' : formatUSD(state.shippingFee);
  if(vatAmtEl) vatAmtEl.textContent         = formatUSD(vat);
  if(totalPriceEl) totalPriceEl.textContent = formatUSD(total);
  if(btnTotal) btnTotal.textContent         = formatUSD(total);

  if (state.discountPct > 0) {
    if(discountRow) discountRow.style.display = 'flex';
    if(discountAmt) discountAmt.textContent   = '-' + formatUSD(discount);
  } else {
    if(discountRow) discountRow.style.display = 'none';
  }
}

/* ============================================================
   FETCH PRODUCT
   ============================================================ */
async function fetchProduct() {
  const productNameEl        = document.getElementById('productName');
  const summaryProductNameEl = document.getElementById('summaryProductName');
  const productImgEl         = document.getElementById('productImg');
  const productDescEl        = document.getElementById('productDesc');
  const stockBadgeEl         = document.getElementById('stockBadge');
  const loadingOverlay       = document.getElementById('loadingOverlay');

  try {
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const res = await fetch(`${API_BASE}/${productId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const product = json.data ? json.data[0] : json;
    if (!product) throw new Error('لا يوجد منتج بهذا المعرّف');
    
    UNIT_PRICE = parseFloat(product.price);
    
    if (productNameEl) productNameEl.textContent = product.product_name;
    if (summaryProductNameEl) summaryProductNameEl.textContent = product.product_name;
    if (productImgEl)  { productImgEl.src = product.imgURL; productImgEl.alt = product.product_name; }
    if (productDescEl) productDescEl.innerText = product.description;
    
    if (stockBadgeEl) {
      const stock = product.Stock_Quantity;
      stockBadgeEl.textContent       = stock > 0 ? `متوفر (${stock} قطعة)` : 'غير متوفر';
      stockBadgeEl.dataset.inStock   = stock > 0 ? 'true' : 'false';
    }

    document.title = product.product_name + ' — طلب';

  } catch (err) {
    console.error('خطأ في جلب المنتج:', err);
    if (productNameEl) productNameEl.textContent = 'تعذّر تحميل بيانات المنتج.';
  } finally {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    recalculate();
  }
}

/* ============================================================
   CHECK USER AUTHENTICATION
   ============================================================ */
const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("regusiterLink");
const usernameText = document.getElementById("usernameText");
const links = document.getElementById("links");

async function checkUser() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return window.location.href = "login.html";

    const res = await fetch("http://localhost:3000/api/auth/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (data.success) {
      if(usernameText) {
        usernameText.innerHTML = `<i class="fa-solid fa-circle-user"></i> أهلاً بك , ${data.user.name}`;
        usernameText.classList.add("visible");
      }
      if(links) links.style.display = 'none';
    } else {
      localStorage.removeItem("token");
    }
  } catch (err) {
    console.error("Auth error:", err);
  }
}

/* ============================================================
   EVENTS & CONTROLS
   ============================================================ */
document.getElementById('qtyDecrease')?.addEventListener('click', () => {
  if (state.qty > 1) { state.qty--; qtyDisplay.textContent = state.qty; recalculate(); }
});

document.getElementById('qtyIncrease')?.addEventListener('click', () => {
  if (state.qty < 10) { state.qty++; qtyDisplay.textContent = state.qty; recalculate(); }
});

document.getElementById('applyCoupon')?.addEventListener('click', () => {
  const code  = document.getElementById('couponInput').value.trim().toUpperCase();
  const msgEl = document.getElementById('couponMsg');

  if (!code) {
    msgEl.textContent = 'الرجاء إدخال كود الخصم.';
    msgEl.className = 'coupon-msg error';
    return;
  }

  if (VALID_COUPONS[code]) {
    state.discountPct = VALID_COUPONS[code];
    state.couponApplied = true;
    msgEl.textContent = `✓ تم تطبيق الكود! خصم ${state.discountPct * 100}%`;
    msgEl.className = 'coupon-msg success';
  } else {
    state.discountPct = 0;
    state.couponApplied = false;
    msgEl.textContent = '✗ كود الخصم غير صحيح.';
    msgEl.className = 'coupon-msg error';
  }
  recalculate();
});

document.querySelectorAll('input[name="shippingMethod"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.value === 'standard') state.shippingFee = 25.00;
    else if (e.target.value === 'express') state.shippingFee = 45.00;
    recalculate();
  });
});

document.querySelectorAll('.payment-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const target = document.getElementById('tab-' + tab.dataset.tab);
    if (target) target.classList.add('active');
  });
});

/* ============================================================
   FORM VALIDATION HELPERS
   ============================================================ */
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function isValidPhone(phone) { return /^[\d\s\+\-]{7,15}$/.test(phone); }

function highlightInvalid(el) {
  if(!el) return;
  el.style.borderColor = '#f87171';
  el.style.boxShadow   = '0 0 0 3px rgba(248,113,113,0.2)';
  el.addEventListener('input', () => {
    el.style.borderColor = '';
    el.style.boxShadow   = '';
  }, { once: true });
}

function validateForm() {
  const fields = {
    email:     document.getElementById('email'),
    phone:     document.getElementById('phone'),
    address:   document.getElementById('address'),
    city:      document.getElementById('city'),
  };

  let valid = true;

  ['address', 'city'].forEach(key => {
    if (fields[key] && !fields[key].value.trim()) { highlightInvalid(fields[key]); valid = false; }
  });

  if (fields.email && !isValidEmail(fields.email.value.trim())) { highlightInvalid(fields.email); valid = false; }
  if (fields.phone && !isValidPhone(fields.phone.value.trim())) { highlightInvalid(fields.phone); valid = false; }

  return valid;
}

/* ============================================================
   PLACE ORDER (INTEGRATED WITH BACKEND)
   ============================================================ */
const placeOrderBtn = document.getElementById('placeOrderBtn');
const successModal  = document.getElementById('successModal');
const orderNumberEl = document.getElementById('orderNumber');

placeOrderBtn?.addEventListener('click', async () => {
  if (!validateForm()) {
    const firstInvalid = document.querySelector('input[style*="border-color"]');
    if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  let selectedPaymentMethod = 'card'; // Default
  const activePaymentTab = document.querySelector('.payment-tab.active');
  
  if (activePaymentTab) {
    if (activePaymentTab.dataset.tab === 'wallet') {
       selectedPaymentMethod = document.querySelector('input[name="wallet"]:checked')?.value || 'wallet';
    } else {
       selectedPaymentMethod = activePaymentTab.dataset.tab;
    }
  }

  const subtotal   = UNIT_PRICE * state.qty;
  const discount   = subtotal * state.discountPct;
  const afterDisc  = subtotal - discount;
  const vat        = afterDisc * VAT_RATE;
  const finalTotal = afterDisc + vat + state.shippingFee;
  const payload = {
    totalAmount: finalTotal,
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim(),
    counter: document.getElementById('country') ? document.getElementById('country').value : 'Egypt',
    phone: document.getElementById('phone').value.trim(),
    notes: document.getElementById('notes') ? document.getElementById('notes').value.trim() : '',
    Payment_Method: selectedPaymentMethod
  };

  placeOrderBtn.textContent = '⏳ جارٍ معالجة الطلب...';
  placeOrderBtn.disabled = true;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch('http://localhost:3000/api/order/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const dbOrderId = result.data?.order?.order_id || Math.floor(10000 + Math.random() * 90000);
      orderNumberEl.textContent = '#ORD-' + dbOrderId;
      successModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      alert('فشل تأكيد الطلب: ' + (result.message || 'خطأ في الخادم'));
    }

  } catch (error) {
    console.error('Fetch Error:', error);
    alert('تعذر الاتصال بالسيرفر. يرجى المحاولة لاحقاً.');
  } finally {
    placeOrderBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      تأكيد الطلب — <span id="btnTotal">${formatUSD(finalTotal)}</span>
    `;
    placeOrderBtn.disabled = false;
  }
});

/* ============================================================
   MODALS & MENUS
   ============================================================ */
document.getElementById('closeModal')?.addEventListener('click', () => {
  successModal.classList.remove('open');
  document.body.style.overflow = '';
    window.location.href = "../index.html"
});

successModal?.addEventListener('click', (e) => {
  if (e.target === successModal) {
    successModal.classList.remove('open');
    document.body.style.overflow = '';
    window.location.href = "../index.html"
  }
});

const burgerBtn = document.getElementById('burger-btn');
const navbarCollapse = document.getElementById('navbar-collapse');
if (burgerBtn && navbarCollapse) {
  burgerBtn.addEventListener('click', () => {
    burgerBtn.classList.toggle('active');
    navbarCollapse.classList.toggle('active');
  });
}

checkUser();
fetchProduct();