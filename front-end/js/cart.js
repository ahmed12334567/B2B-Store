/* ============================================================
   cart.js — Full cart integration with http://localhost:3000/api/cart/
   Handles: fetch cart, add to cart, remove from cart, UI updates
   ============================================================ */

const CART_API = "http://localhost:3000/api/cart";

// ── Helpers ──────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
}

function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// ── API calls ────────────────────────────────────────────────
async function apiGetCart() {
  const res = await fetch(`${CART_API}/get-cart`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.json();
}

async function apiAddToCart(productId, quantity = 1) {
  const res = await fetch(`${CART_API}/add-to-cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });
  return res.json();
}

async function apiDeleteFromCart(productId) {
  const res = await fetch(`${CART_API}/delete-product-cart`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ productId }),
  });
  return res.json();
}

// ── Cart State ───────────────────────────────────────────────
let cartItems = [];

function cacheAddButtonState(btnEl) {
  if (!btnEl) return;
  if (!btnEl.dataset.originalHtml) {
    btnEl.dataset.originalHtml = btnEl.innerHTML;
  }
}

function markAddButtonAsAdded(btnEl) {
  if (!btnEl) return;
  cacheAddButtonState(btnEl);
  btnEl.innerHTML = `<i class="fa-solid fa-check"></i> تمت الإضافة إلى السلة`;
  btnEl.classList.add("cart-added");
  btnEl.disabled = true;
}

function restoreAddButton(btnEl) {
  if (!btnEl) return;
  const original = btnEl.dataset.originalHtml || btnEl.innerHTML;
  btnEl.innerHTML = original;
  btnEl.classList.remove("cart-added");
  btnEl.disabled = false;
}

function restoreAddButtonsForProduct(productId) {
  document
    .querySelectorAll(`[data-product-id="${productId}"] .btn-cart, #btn-add-cart[data-product-id="${productId}"]`)
    .forEach(restoreAddButton);
}

// ── DOM Helpers ──────────────────────────────────────────────
function updateCartBadge(count) {
  const badge = document.querySelector(".cart-badge");
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle("has-items", count > 0);
}

function getProductDetailsUrl(productId) {
  const id = encodeURIComponent(productId);
  const isPagesPath = window.location.pathname.includes("/pages/");
  return `${isPagesPath ? "product.html" : "pages/product.html"}?id=${id}`;
}

function getOrderUrl(productId) {
  const id = encodeURIComponent(productId);
  const isPagesPath = window.location.pathname.includes("/pages/");
  return `${isPagesPath ? "order.html" : "pages/order.html"}?id=${id}`;
}

function updateCheckoutLink() {
  const checkoutLink = document.querySelector(".cart-checkout-btn");
  if (!checkoutLink || !cartItems.length) return;
  checkoutLink.href = getOrderUrl(cartItems[0].product_id);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function renderCartItems() {
  const list = document.getElementById("cart-items-list");
  const emptyMsg = document.getElementById("cart-empty-msg");
  const footer = document.getElementById("cart-footer");
  if (!list) return;

  list.innerHTML = "";

  if (!cartItems.length) {
    if (emptyMsg) emptyMsg.style.display = "flex";
    if (footer) footer.style.display = "none";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";
  if (footer) footer.style.display = "block";
  updateCheckoutLink();

  let total = 0;

  cartItems.forEach((item) => {
    total += item.price * item.quantity;
    const productUrl = getProductDetailsUrl(item.product_id);
    const productName = escapeHtml(item.product_name);
    const productImage = escapeHtml(item.imgURL);
    const el = document.createElement("div");
    el.className = "cart-item";
    el.dataset.productId = item.product_id;
    el.innerHTML = `
      <a href="${productUrl}" class="cart-item-image-link" aria-label="View ${productName}">
        <img src="${productImage}" alt="${productName}" class="cart-item-img" onerror="this.src='../assets/images/placeholder.jpg'">
      </a>
      <div class="cart-item-info">
        <a href="${productUrl}" class="cart-item-name cart-item-name-link">${productName}</a>
        <p class="cart-item-price">${item.price}$ x ${item.quantity}</p>
        <p class="cart-item-subtotal">${(item.price * item.quantity).toFixed(2)}$</p>
      </div>
      <button class="cart-item-remove" data-id="${item.product_id}" aria-label="Remove">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    list.appendChild(el);
  });

  const totalEl = document.getElementById("cart-total");
  if (totalEl) totalEl.textContent = `${total.toFixed(2)}$`;

  // Attach remove listeners
  list.querySelectorAll(".cart-item-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id, 10);
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
      await removeFromCart(id);
    });
  });
}

// ── Load Cart ────────────────────────────────────────────────
async function loadCart() {
  if (!isLoggedIn()) {
    cartItems = [];
    updateCartBadge(0);
    renderCartItems();
    return;
  }
  try {
    const data = await apiGetCart();
    if (data.success) {
      cartItems = data.data.cart || [];
    } else {
      cartItems = [];
    }
  } catch {
    cartItems = [];
  }
  updateCartBadge(cartItems.length);
  renderCartItems();
}

// ── Add to Cart ──────────────────────────────────────────────
async function addToCart(productId, btnEl) {
  if (!isLoggedIn()) {
    showCartToast("يجب تسجيل الدخول أولاً", "error");
    return;
  }

  let succeeded = false;
  if (btnEl) {
    cacheAddButtonState(btnEl);
    btnEl.disabled = true;
    btnEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  }

  try {
    const data = await apiAddToCart(productId, 1);
    if (data.success) {
      succeeded = true;
      showCartToast("✓ تمت الإضافة إلى السلة");
      await loadCart();

      if (btnEl) {
        markAddButtonAsAdded(btnEl);
      }
    } else {
      showCartToast(data.message || "حدث خطأ", "error");
    }
  } catch {
    showCartToast("تعذّر الاتصال بالسيرفر", "error");
  } finally {
    if (btnEl && !succeeded) {
      restoreAddButton(btnEl);
    }
  }
}

// ── Remove from Cart ─────────────────────────────────────────
async function removeFromCart(productId) {
  try {
    const data = await apiDeleteFromCart(productId);
    if (data.success) {
      cartItems = cartItems.filter((i) => i.product_id !== productId);
      updateCartBadge(cartItems.length);
      renderCartItems();
      restoreAddButtonsForProduct(productId);
      showCartToast("تم حذف المنتج من السلة");
    } else {
      showCartToast("فشل الحذف", "error");
      await loadCart();
    }
  } catch {
    showCartToast("تعذّر الاتصال بالسيرفر", "error");
    await loadCart();
  }
}

// ── Toast Notification ───────────────────────────────────────
function showCartToast(message, type = "success") {
  let toast = document.getElementById("cart-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cart-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `cart-toast cart-toast--${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ── Sidebar open/close ───────────────────────────────────────
function openCartSidebar() {
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");
  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.classList.add("open");

  // ✅ احسب عرض الـ scrollbar وعوّض عنه
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingInlineEnd = `${scrollbarWidth}px`;

  document.body.classList.add("cart-open");
  document.body.style.overflow = "hidden";

  loadCart();
}


function closeCartSidebar() {
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");

  document.body.classList.remove("cart-open");
  document.body.style.overflow = "";
  document.body.style.paddingInlineEnd = "";
}


// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Cart button in navbar
  const cartBtn = document.getElementById("cart-button");
  if (cartBtn) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openCartSidebar();
    });
  }

  // Close button inside sidebar
  const closeBtn = document.getElementById("cart-close-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeCartSidebar);

  // Overlay click closes
  const overlay = document.getElementById("cart-overlay");
  if (overlay) overlay.addEventListener("click", closeCartSidebar);

  // Escape key closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCartSidebar();
  });

  // "Add to cart" buttons on product cards (index page)
  document.querySelectorAll(".btn-cart").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest("[data-product-id]");
      const productId = card ? parseInt(card.dataset.productId, 10) : null;
      if (productId) await addToCart(productId, btn);
    });
  });

  // "Add to cart" button on product detail page
  const addCartDetailBtn = document.getElementById("btn-add-cart");
  if (addCartDetailBtn) {
    addCartDetailBtn.addEventListener("click", async function () {
      const productId = parseInt(this.dataset.productId, 10);
      if (productId) await addToCart(productId, this);
    });
  }

  // Load initial badge count
  loadCart();
});

// Export for use in other scripts
window.cartAPI = { addToCart, removeFromCart, loadCart, openCartSidebar, closeCartSidebar };
