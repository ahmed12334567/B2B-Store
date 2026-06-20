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
const cards = document.querySelectorAll(".product-card");

fetch("http://localhost:3000/api/products/")
  .then(res => res.json())
  .then(result => {
    const products = result.data;
    const cards = document.querySelectorAll(".product-card");

    cards.forEach((card, index) => {
      const product = products[index];

      if (!product) return;

      card.href = `pages/product.html?id=${product.product_id}`;

      card.querySelector("img").src = product.imgURL;
      card.querySelector("img").alt = product.product_name;

      card.querySelector("h4").textContent = product.product_name;

      card.querySelector(".description").textContent =
        product.description.substring(0, 80) + "...";

      card.querySelector(".price-current").textContent =
        `${product.price}$`;
        const originalPrice = Number(product.price);
        const discountedPrice = originalPrice + (originalPrice * 20 / 100);
      card.querySelector(".price-old").textContent =
      `${discountedPrice}`
    });
  })
  .catch(err => console.error(err));

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
