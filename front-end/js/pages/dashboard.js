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
async function apiFetch(endpoint) {
  const token = getAdminToken();
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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

  // Update stat counters with animation
  animateCounter("totalUsersCount", stats.totalUsers || 0);
  animateCounter("totalProductsCount", stats.totalProducts || 0);
  animateCounter("totalOrdersCount", stats.totalOrders || 0);

  // Users badge
  const usersBadge = document.getElementById("usersBadge");
  if (usersBadge && stats.totalUsers > 0) {
    usersBadge.textContent = stats.totalUsers;
    usersBadge.style.display = "inline";
  }

  // Render recent users table
  renderRecentUsers(stats.recentUsers || []);

  // Render recent products table
  renderRecentProducts(stats.recentProducts || []);
}

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

  if (products.length === 0) {
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
          ${
            product.image_url
              ? `<img src="${product.image_url}" class="product-thumb" alt="${product.name}">`
              : `<div class="product-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-image" style="color:var(--text-muted);"></i></div>`
          }
          <span class="product-name">${product.name || "بدون اسم"}</span>
        </div>
      </td>
      <td><span class="price-tag">$${product.price || 0}</span></td>
    </tr>`
    )
    .join("");
}

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

  const products = data.data || [];

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
          ${
            product.image_url
              ? `<img src="${product.image_url}" class="product-thumb" alt="${product.name}">`
              : `<div class="product-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-image" style="color:var(--text-muted);"></i></div>`
          }
          <span class="product-name">${product.name || "بدون اسم"}</span>
        </div>
      </td>
      <td><span class="price-tag">$${product.price || 0}</span></td>
      <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${product.description || "—"}
      </td>
    </tr>`
    )
    .join("");
}
