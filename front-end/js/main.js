const toggle = document.getElementById("toggle");
const html = document.documentElement;
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  html.classList.add("dark");
  toggle.checked = true;
} else {
  html.classList.remove("dark");
  toggle.checked = false;
}

toggle.addEventListener("change", function () {
  if (this.checked) {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
});

window.addEventListener("load", () => {
  document.body.classList.remove("page-loading");
  document.body.classList.add("page-loaded");
});

const observerOptions = {
  threshold: 0.12,
  rootMargin: "0px 0px -40px 0px"
};

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      scrollObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll(".animate-on-scroll").forEach(el => {
  scrollObserver.observe(el);
});

const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("regusiterLink");
const usernameText = document.getElementById("usernameText");
const links = document.getElementById("links");

async function checkUser() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/api/auth/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (data.success) {
      loginLink.style.display = "none";
      registerLink.style.display = "none";
      links.style.display = "none";

      usernameText.innerHTML = `<i class="fa-solid fa-circle-user"></i> أهلاً بك , ${data.user.name}`;
      usernameText.classList.add("visible");
    } else {
      localStorage.removeItem("token"); 
    }

  } catch (err) {
    console.error("error:", err);
  }
}

checkUser();


async function loadProducts(containerId, apiUrl) {
  const container = document.getElementById(containerId);

  // Loading state
  container.innerHTML = `
    <div class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>جاري تحميل المنتجات...</p>
    </div>
  `;

  try {
    const response = await fetch(apiUrl);
    const json = await response.json();

    if (!json.success || !json.data.length) {
      container.innerHTML = `<p class="error-msg">لا توجد منتجات متاحة حالياً</p>`;
      return;
    }

    container.innerHTML = json.data.map(product => {
      const price = parseFloat(product.price);
      const oldPrice = (price / 0.8).toFixed(2);

     return `
  <div class="product-wrapper" data-product-id="${product.product_id}">
    <a href="pages/product.html?id=${product.product_id}" class="product-card animate-on-scroll">
      <div class="product-card-image">
        <img src="${product.imgURL}" alt="${product.product_name}" class="product-img" loading="lazy">
      </div>
      <div class="product-card-body">
        <h4>${product.product_name}</h4>
        <p class="description">${product.description}</p>
        <div class="price-row">
          <span class="price-current">$${price.toFixed(2)}</span>
          <span class="price-old">$${oldPrice}</span>
        </div>
        <div class="card-actions">
          <button class="btn-buy">
            <i class="fa-solid fa-bolt"></i>
            اشتري الآن
          </button>
          <button class="btn-cart">
            <i class="fa-solid fa-cart-plus"></i>
            أضف إلى السلة
          </button>
        </div>
        <p class="delivery-info">
          <i class="fa-solid fa-truck-fast"></i>
          توصيل خلال 3-5 أيام
        </p>
      </div>
    </a>
  </div>
`;
    }).join('');
container.querySelectorAll(".animate-on-scroll").forEach(el => {
  scrollObserver.observe(el);
});
  } catch (error) {
    console.error('Error loading products:', error);
    container.innerHTML = `
      <div class="error-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>حدث خطأ أثناء تحميل المنتجات، حاول مرة أخرى</p>
        <button onclick="loadProducts('${containerId}', '${apiUrl}')">إعادة المحاولة</button>
      </div>
    `;
  }
}
loadProducts("products-grid", "http://localhost:3000/api/products/")
const burgerBtn = document.getElementById("burger-btn");
const navbarCollapse = document.getElementById("navbar-collapse");

if (burgerBtn && navbarCollapse) {
  burgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    burgerBtn.classList.toggle("active");
    navbarCollapse.classList.toggle("active");
  });

  navbarCollapse.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      burgerBtn.classList.remove("active");
      navbarCollapse.classList.remove("active");
    });
  });

  document.addEventListener("click", (e) => {
    const isClickInsideNavbar = e.target.closest("#main-navbar");
    if (!isClickInsideNavbar && navbarCollapse.classList.contains("active")) {
      burgerBtn.classList.remove("active");
      navbarCollapse.classList.remove("active");
    }
  });
}
