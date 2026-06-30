// ========================================
// ADMIN DASHBOARD — JavaScript
// ========================================

const API_BASE = "http://localhost:3000/api/dashboard";

// ========================================
// AUTH GUARD — Redirect if no admin token
// ========================================
function getAdminToken() {
  return localStorage.getItem("adminToken");
}

function checkAuth() {
  const token = getAdminToken();
  if (!token) {
    window.location.replace("admin-login.html");
    return false;
  }
  return true;
}

if (!checkAuth()) {
  // Stop execution if not authenticated
  throw new Error("Not authenticated");
}

// ========================================
// PAGE LOAD ANIMATION
// ========================================
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.body.classList.remove("page-loading");
    document.body.classList.add("page-loaded");
  }, 200);

  // Set current time
  updateTime();
  setInterval(updateTime, 60000);

  // Load dashboard data
  loadDashboardStats();

  // Initialize add product feature
  initAddProductFeature();

  // Initialize add file products feature
  initAddFileProducts();
});

function updateTime() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const timeEl = document.getElementById("currentTime");
  if (timeEl) {
    timeEl.textContent = now.toLocaleDateString("ar-SA", options);
  }
}

// ========================================
// THEME TOGGLE
// ========================================
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

// ========================================
// SIDEBAR NAVIGATION
// ========================================
const sidebarLinks = document.querySelectorAll(".sidebar-link[data-page]");
const pageSections = document.querySelectorAll(".page-section");
const pageTitle = document.getElementById("pageTitle");

const pageTitles = {
  overview: "نظرة عامة",
  users: "المستخدمون",
  products: "المنتجات",
  orders: "الطلبات",
  settings: "الإعدادات",
};

sidebarLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    navigateTo(page);
  });
});

function navigateTo(page) {
  // Update sidebar active state
  sidebarLinks.forEach((l) => l.classList.remove("active"));
  const activeLink = document.querySelector(`[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add("active");

  // Show the target page section
  pageSections.forEach((s) => (s.style.display = "none"));
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) targetPage.style.display = "block";

  // Update topbar title
  if (pageTitle) pageTitle.textContent = pageTitles[page] || page;

  // Load data for the page if needed
  if (page === "users") loadAllUsers();
  if (page === "products") loadAllProducts();
  if (page === "orders") loadAllOrders();

  // Close mobile sidebar
  closeSidebar();
}

// ========================================
// MOBILE SIDEBAR TOGGLE
// ========================================
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("show");
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", closeSidebar);
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
}

// ========================================
// LOGOUT
// ========================================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("adminToken");
    window.location.replace("admin-login.html");
  });
}

// ========================================
// API HELPERS
// ========================================
async function apiFetch(endpoint, options = {}) {
  const token = getAdminToken();
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("adminToken");
      window.location.replace("admin-login.html");
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("API Error:", err);
    return null;
  }
}

// Avatar color palette
const avatarColors = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
  "linear-gradient(135deg, #ec4899, #db2777)",
];

function getAvatarColor(index) {
  return avatarColors[index % avatarColors.length];
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return parts[0].substring(0, 2);
}

// ========================================
// LOAD DASHBOARD STATS (Overview page)
// ========================================
async function loadDashboardStats() {
  const data = await apiFetch("/stats");
  if (!data || !data.success) return;

  const stats = data.data;

  animateCounter("totalUsersCount", stats.totalUsers || 0);
  animateCounter("totalProductsCount", stats.totalProducts || 0);
  animateCounter("totalOrdersCount", stats.totalOrders || 0);

  const usersBadge = document.getElementById("usersBadge");
  if (usersBadge && stats.totalUsers > 0) {
    usersBadge.textContent = stats.totalUsers;
    usersBadge.style.display = "inline";
  }

  renderRecentUsers(stats.recentUsers || []);

  const mergedRecentProducts = (stats.recentProducts || []).slice(0, 5);
  renderRecentProducts(mergedRecentProducts);
}

loadDashboardStats();

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 800;
  const start = performance.now();
  const startVal = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * ease);
    el.textContent = current.toLocaleString("ar-SA");
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function renderRecentUsers(users) {
  const tbody = document.getElementById("recentUsersTable");
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2">
          <div class="empty-state">
            <i class="fa-solid fa-user-slash"></i>
            <p>لا يوجد مستخدمون</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = users
    .map(
      (user, i) => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="user-avatar" style="background: ${getAvatarColor(i)};">
            ${getInitials(user.name)}
          </div>
          <span class="user-name">${user.name || "بدون اسم"}</span>
        </div>
      </td>
      <td><span class="user-email">${user.email}</span></td>
    </tr>`
    )
    .join("");
}

function renderRecentProducts(products) {
  const tbody = document.getElementById("recentProductsTable");
  if (!tbody) return;

  if (!products || products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2">
          <div class="empty-state">
            <i class="fa-solid fa-box-open"></i>
            <p>لا توجد منتجات</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = products
    .map(
      (product) => `
    <tr>
      <td>
        <div class="product-cell">
          ${product.imgURL
          ? `<img src="${product.imgURL}" class="product-thumb" alt="${product.product_name}">`
          : `<div class="product-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-image" style="color:var(--text-muted);"></i></div>`
        }
          <span class="product-name">${product.product_name}</span>
        </div>
      </td>
      <td><span class="price-tag">$${product.price || 0}</span></td>
    </tr>`
    )
    .join("");
}

async function getLastProducts() {
  const data = await apiFetch("/stats");
  if (!data || !data.success) return;

  renderRecentProducts(data.data.recentProducts);
}

getLastProducts();
// ========================================
// LOAD ALL USERS (Users page)
// ========================================
async function loadAllUsers() {
  const data = await apiFetch("/users");
  if (!data || !data.success) return;

  const tbody = document.getElementById("allUsersTable");
  if (!tbody) return;

  const users = data.data || [];

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i class="fa-solid fa-user-slash"></i>
            <p>لا يوجد مستخدمون</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = users
    .map(
      (user, i) => `
    <tr>
      <td>${user.user_id}</td>
      <td>
        <div class="user-cell">
          <div class="user-avatar" style="background: ${getAvatarColor(i)};">
            ${getInitials(user.name)}
          </div>
          <div class="user-info">
            <span class="user-name">${user.name || "بدون اسم"}</span>
            ${user.isGoogleUser ? '<span class="user-email"><i class="fa-brands fa-google" style="color:#4285f4;"></i> Google</span>' : ""}
          </div>
        </div>
      </td>
      <td>${user.email}</td>
      <td>${user.phone || "—"}</td>
      <td>
        <span class="role-badge ${user.role === "admin" ? "admin" : "user"}">
          ${user.role === "admin" ? "مسؤول" : "مستخدم"}
        </span>
      </td>
          <td>

        <button class="delete-btn" data-id="${user.user_id}" data-type="user" title="حذف المستخدم">
        <i class="fa-solid fa-trash-can"></i> حذف
        </button>
          </td>
    </tr>`
    )
    .join("");
}

// ========================================
// LOAD ALL PRODUCTS (Products page)
// ========================================
async function loadAllProducts() {
  const data = await apiFetch("/products");
  if (!data || !data.success) return;

  const tbody = document.getElementById("allProductsTable");
  if (!tbody) return;

  const apiProducts = data.data || [];
  const products = [...apiProducts];

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <i class="fa-solid fa-box-open"></i>
            <p>لا توجد منتجات</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = products
    .map(
      (product) => `
    <tr>
      <td>${product.product_id}</td>
      <td>
        <div class="product-cell">
          ${product.imgURL
          ? `<img src="${product.imgURL}" class="product-thumb" alt="${product.product_name}">`
          : `<div class="product-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-image" style="color:var(--text-muted);"></i></div>`
        }
          <span class="product-name">${product.product_name}</span>
        </div>
      </td>
      <td><span class="price-tag">$${product.price || 0}</span></td>
      <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${product.description || "—"}
      </td>
          <td>
        <button class="delete-btn" data-id="${product.product_id}" data-type="product" title="حذف المنتج">
        <i class="fa-solid fa-trash-can"></i> حذف
        </button>
          </td>
    </tr>`
    )
    .join("");
}
// load all orders
async function loadAllOrders() {
  const data = await apiFetch("/all-orders");
  if (!data || !data.success) return;

  const tbody = document.getElementById("allOrdersTable");
  if (!tbody) return;

  const apiOrders = data.data.orders || [];
  const orders = [...apiOrders];

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i class="fa-solid fa-box-open"></i>
            <p>لا توجد طلبات</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map((order, index) => {
      const date = new Date(order.createAt);

      const formatted = !isNaN(date)
        ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
        : "—";

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${order.name || "غير معروف"}</td>
          <td>${order.email || "—"}</td>
          <td>
            <span class="status-badge status-${String(order.Order_Status).toLowerCase()}">
              ${order.Order_Status || "معلق"}
            </span>
          </td>
          <td>${formatted}</td>
          <td><span class="price-tag">$${order.Total_Amount || 0}</span></td>
          <td>
          <button class="delete-btn" data-id="${order.order_id}" data-type="order" title="حذف الطلب">
            <i class="fa-solid fa-trash-can"></i> حذف
          </button>
          </td>
        </tr>
      `;
    })
    .join("");
}
async function deleteOrder(orderId) {
  try {
    const response = await apiFetch(`/delete-order/${orderId}`, { method: "DELETE" });
    if (response && response.success) {
      showToast("تم حذف الطلب بنجاح!", "success");
      loadAllOrders();
      loadDashboardStats(); // تحديث الإحصائيات
    } else {
      showToast("فشل في حذف الطلب، يرجى المحاولة لاحقاً", "error");
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    showToast("حدث خطأ أثناء حذف الطلب", "error");
  }
}

async function deleteProduct(productId) {
  try {
    // تم تعديل الرابط ليكون خاص بالمنتجات (تأكد أن هذا هو الرابط الصحيح في الباك إند)
    const response = await apiFetch(`/delete-product/${productId}`, { method: "DELETE" });
    if (response && response.success) {
      showToast("تم حذف المنتج بنجاح!", "success");
      loadAllProducts(); // تم تعديله لتحديث جدول المنتجات
      loadDashboardStats();
    } else {
      showToast("فشل في حذف المنتج، يرجى المحاولة لاحقاً", "error");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    showToast("حدث خطأ أثناء حذف المنتج", "error");
  }
}

async function deleteUser(userId) {
  try {
    // تمت إضافة دالة حذف المستخدم (تأكد أن هذا هو الرابط الصحيح في الباك إند)
    const response = await apiFetch(`/delete-user/${userId}`, { method: "DELETE" });
    if (response && response.success) {
      showToast("تم حذف المستخدم بنجاح!", "success");
      loadAllUsers(); // تحديث جدول المستخدمين
      loadDashboardStats();
    } else {
      showToast("فشل في حذف المستخدم، يرجى المحاولة لاحقاً", "error");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    showToast("حدث خطأ أثناء حذف المستخدم", "error");
  }
}

let itemToDelete = null;
let deleteEntityType = null; // متغير جديد لمعرفة نوع العنصر (مستخدم، منتج، طلب)
const deleteModal = document.getElementById("deleteModal");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const confirmDeleteBtn = document.getElementById("confirmDelete");

function openDeleteModal() {
  if (deleteModal) deleteModal.classList.add("show");
}

function closeDeleteModal() {
  if (deleteModal) deleteModal.classList.remove("show");
}

// التقاط الضغط على أي زر حذف
document.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn && deleteBtn.dataset.id) {
    itemToDelete = deleteBtn.dataset.id;
    deleteEntityType = deleteBtn.dataset.type; // تخزين نوع العنصر
    openDeleteModal();
  }
});

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", () => {
    itemToDelete = null;
    deleteEntityType = null;
    closeDeleteModal();
  });
}

// تأكيد الحذف
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async () => {
    if (itemToDelete && deleteEntityType) {
      const originalText = confirmDeleteBtn.textContent;
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "جاري الحذف...";

      // توجيه أمر الحذف بناءً على نوع العنصر
      if (deleteEntityType === "order") {
        await deleteOrder(itemToDelete);
      } else if (deleteEntityType === "product") {
        await deleteProduct(itemToDelete);
      } else if (deleteEntityType === "user") {
        await deleteUser(itemToDelete);
      }

      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = originalText;
      itemToDelete = null;
      deleteEntityType = null;
    }
    closeDeleteModal();
  });
}

if (deleteModal) {
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
      itemToDelete = null;
      deleteEntityType = null;
      closeDeleteModal();
    }
  });
}

const rBtn = document.getElementById("refreshOrdersBtn");
if (rBtn) {
  rBtn.addEventListener("click", () => {
    loadAllOrders();
  });
}
let selectedProductImageBase64 = "";

function initAddProductFeature() {
  const quickAddBtn = document.getElementById("quickAddProductBtn");
  const openAddBtn = document.getElementById("openAddProductBtn");
  const closeBtn = document.getElementById("closeAddProductModalBtn");
  const cancelBtn = document.getElementById("cancelAddProductBtn");
  const form = document.getElementById("addProductForm");
  const addProductModal = document.getElementById("addProductModal");
  const fileInput = document.getElementById("prodImage");
  const fileText = document.getElementById("file-upload-text");
  const previewContainer = document.getElementById("imagePreviewContainer");
  const previewImg = document.getElementById("imagePreview");

  if (quickAddBtn) quickAddBtn.addEventListener("click", openAddProductModal);
  if (openAddBtn) openAddBtn.addEventListener("click", openAddProductModal);
  if (closeBtn) closeBtn.addEventListener("click", closeAddProductModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeAddProductModal);

  if (addProductModal) {
    addProductModal.addEventListener("click", (e) => {
      if (e.target === addProductModal) {
        closeAddProductModal();
      }
    });
  }

  // Handle file select and read base64
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        selectedProductImageBase64 = "";
        if (fileText) fileText.textContent = "اختر صورة للمنتج";
        if (previewContainer) previewContainer.style.display = "none";
        return;
      }

      // Check file size (max 1.5MB to protect localStorage space)
      if (file.size > 1.5 * 1024 * 1024) {
        document.getElementById("prodImageError").style.display = "block";
        selectedProductImageBase64 = "";
        if (fileText) fileText.textContent = "اختر صورة للمنتج";
        if (previewContainer) previewContainer.style.display = "none";
        fileInput.value = "";
        return;
      } else {
        document.getElementById("prodImageError").style.display = "none";
      }

      if (fileText) fileText.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (event) => {
        selectedProductImageBase64 = event.target.result;
        if (previewImg) previewImg.src = selectedProductImageBase64;
        if (previewContainer) previewContainer.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  if (form) {
    form.addEventListener("submit", handleAddProductSubmit);
  }
}

function openAddProductModal() {
  const addProductModal = document.getElementById("addProductModal");
  if (addProductModal) {
    addProductModal.classList.add("show");
  }
}
function openAddFileProductModal() {
  const modal = document.getElementById("addProductFileModal");
  if (modal) {
    modal.classList.add("show");
  }
}

function closeAddProductModal() {
  const addProductModal = document.getElementById("addProductModal");
  if (addProductModal) {
    addProductModal.classList.remove("show");
  }
  resetAddProductForm();
}
function closeAddFileProductModal() {
  const modal = document.getElementById("addProductFileModal");
  if (modal) {
    modal.classList.remove("show");
  }
  resetAddFileProductForm();
}

function resetAddProductForm() {
  const form = document.getElementById("addProductForm");
  if (form) form.reset();

  selectedProductImageBase64 = "";

  const fileText = document.getElementById("file-upload-text");
  if (fileText) fileText.textContent = "اختر صورة للمنتج";

  const previewContainer = document.getElementById("imagePreviewContainer");
  if (previewContainer) previewContainer.style.display = "none";

  const previewImg = document.getElementById("imagePreview");
  if (previewImg) previewImg.src = "";

  ["prodName", "prodPrice", "prodCategory", "prodQuantity"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.borderColor = "";
  });

  ["prodNameError", "prodPriceError", "prodImageError", "prodCategoryError", "prodQuantityError"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function resetAddFileProductForm() {
  const formFile = document.getElementById("addFileProductForm");
  if (formFile) formFile.reset();

  const fileText2 = document.getElementById("file-upload-text-2");
  if (fileText2) fileText2.textContent = "اختر الملف (.xlsx, .xls, .csv, .txt)";

  const prodFileError = document.getElementById("prodFileError");
  if (prodFileError) prodFileError.style.display = "none";
}

async function handleAddProductSubmit(e) {
  e.preventDefault();

  const nameEl = document.getElementById("prodName");
  const priceEl = document.getElementById("prodPrice");
  const categoryEl = document.getElementById("prodCategory");
  const quantityEl = document.getElementById("prodQuantity");
  const descEl = document.getElementById("prodDesc");
  const fileInput = document.getElementById("prodImage");

  const productName = nameEl.value.trim();
  const price = parseFloat(priceEl.value);
  const category = categoryEl.value;
  const quantity = parseInt(quantityEl.value);
  const description = descEl.value.trim();
  const file = fileInput.files[0];

  let isValid = true;

  // التحقق من المدخلات
  if (!productName || productName.length < 3) {
    document.getElementById("prodNameError").style.display = "block";
    nameEl.style.borderColor = "var(--danger)";
    isValid = false;
  } else {
    document.getElementById("prodNameError").style.display = "none";
    nameEl.style.borderColor = "";
  }

  if (isNaN(price) || price <= 0) {
    document.getElementById("prodPriceError").style.display = "block";
    priceEl.style.borderColor = "var(--danger)";
    isValid = false;
  } else {
    document.getElementById("prodPriceError").style.display = "none";
    priceEl.style.borderColor = "";
  }

  if (!category) {
    document.getElementById("prodCategoryError").style.display = "block";
    categoryEl.style.borderColor = "var(--danger)";
    isValid = false;
  } else {
    document.getElementById("prodCategoryError").style.display = "none";
    categoryEl.style.borderColor = "";
  }

  if (isNaN(quantity) || quantity < 1) {
    document.getElementById("prodQuantityError").style.display = "block";
    quantityEl.style.borderColor = "var(--danger)";
    isValid = false;
  } else {
    document.getElementById("prodQuantityError").style.display = "none";
    quantityEl.style.borderColor = "";
  }

  if (!file) {
    const errorEl = document.getElementById("prodImageError");
    if (errorEl) {
      errorEl.style.display = "block";
      errorEl.textContent = "يرجى اختيار صورة للمنتج (مطلوب).";
    }
    isValid = false;
  } else {
    const errorEl = document.getElementById("prodImageError");
    if (errorEl) errorEl.style.display = "none";
  }

  if (!isValid) return;

  const submitBtn = document.getElementById("submitBtnId") || e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إضافة المنتج ورسم الصورة...';
  }

  try {
    const token = getAdminToken();
    const formData = new FormData();

    formData.append("productName", productName);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("quantity", quantity);
    formData.append("category", category);

    if (file) {
      formData.append("image", file);
    }

    const res = await fetch("http://localhost:3000/api/dashboard/createProduct", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "حدث خطأ أثناء إضافة المنتج");
    }
    showToast("تم إنشاء المنتج بنجاح في قاعدة البيانات!", "success");

    closeAddProductModal();
    loadDashboardStats();

    const activeLink = document.querySelector(".sidebar-link.active");
    if (activeLink && activeLink.dataset.page === "products") {
      loadAllProducts();
    }
    if (activeLink && activeLink.dataset.page === "orders") {
      loadAllOrders();
    }

  } catch (err) {
    console.error("فشل الاتصال بالسيرفر:", err);
    showToast(err.message || "فشل جلب البيانات من السيرفر", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> حفظ المنتج';
    }
  }
}

function initAddFileProducts() {
  const quickAddBtn = document.getElementById("openAddProductFileBtn");
  const openAddBtn = document.getElementById("openAddFileProductBtn");
  const closeBtn = document.getElementById("closeAddFileProductModalBtn");
  const cancelBtn = document.getElementById("cancelAddFileProductBtn");
  const form = document.getElementById("addFileProductForm");
  const addProductModal = document.getElementById("addProductFileModal");

  if (quickAddBtn) quickAddBtn.addEventListener("click", openAddFileProductModal);
  if (openAddBtn) openAddBtn.addEventListener("click", openAddFileProductModal);
  if (closeBtn) closeBtn.addEventListener("click", closeAddFileProductModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeAddFileProductModal);

  if (addProductModal) {
    addProductModal.addEventListener("click", (e) => {
      if (e.target === addProductModal) {
        closeAddFileProductModal();
      }
    });
  }

  const fileInput = document.getElementById("productsFile");
  const fileText = document.getElementById("file-upload-text-2");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (fileText) fileText.textContent = file ? file.name : "اختر الملف (.xlsx, .xls, .csv, .txt)";
    });
  }

  if (form) {
    form.addEventListener("submit", handleAddFileProductSubmit);
  }
}

async function handleAddFileProductSubmit(e) {
  e.preventDefault();

  const fileInput = document.getElementById("productsFile");
  const prodFileError = document.getElementById("prodFileError");
  const file = fileInput.files[0];

  if (!file) {
    if (prodFileError) {
      prodFileError.textContent = "اختر ملف";
      prodFileError.style.display = "block";
    }
    return;
  } else if (prodFileError) {
    prodFileError.style.display = "none";
  }

  const submitBtn = document.getElementById("submitFileBtnId") || e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الملف...';
  }

  try {
    const token = getAdminToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/import-file-products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "حدث خطأ أثناء رفع الملف");
    }

    showToast("تم استيراد المنتجات بنجاح!", "success");

    closeAddFileProductModal();
    loadDashboardStats();

    const activeLink = document.querySelector(".sidebar-link.active");
    if (activeLink && activeLink.dataset.page === "products") {
      loadAllProducts();
    }
  } catch (err) {
    console.error("فشل الاتصال بالسيرفر:", err);
    showToast(err.message || "فشل رفع الملف إلى السيرفر", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> حفظ الملف';
    }
  }
}

// ========================================
// TOAST SYSTEM
// ========================================
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const iconClass = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fa-solid ${iconClass}"></i>
    </div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3000);
}