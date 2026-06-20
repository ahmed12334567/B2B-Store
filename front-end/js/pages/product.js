document.addEventListener('DOMContentLoaded', async () => {

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.body.classList.remove('page-loading');
      document.body.classList.add('page-loaded');
    }, 1000);
  });

  // Scroll animations
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  animateElements.forEach(el => observer.observe(el));

  // Shared Dark Mode Toggle logic
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

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const container = document.getElementById('product-detail-container');
  const loading = document.getElementById('loading-indicator');

  const titleEl = document.getElementById('product-title');
  const descEl = document.getElementById('product-desc');
  const priceEl = document.getElementById('product-price');
  const imageEl = document.getElementById('product-image');

  // Handle burger menu
  const burgerBtn = document.getElementById('burger-btn');
  const navbarCollapse = document.getElementById('navbar-collapse');
  if (burgerBtn && navbarCollapse) {
    burgerBtn.addEventListener('click', () => {
      burgerBtn.classList.toggle('active');
      navbarCollapse.classList.toggle('active');
    });
  }

  if (!productId) {
    loading.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> المنتج غير محدد.';
    loading.style.display = 'block';
    return;
  }

  try {
    loading.style.display = 'block';
    const res = await fetch(`http://localhost:3000/api/products/${productId}`);


    const data = await res.json();
    loading.style.display = 'none';

    if (data.success && data.data && data.data.length > 0) {
      const product = data.data[0];

      // Update DOM
      // We check multiple common names since we don't know the exact DB schema
      titleEl.textContent = product.name || product.product_name || product.title || 'اسم المنتج غير متوفر';
      descEl.textContent = product.description || product.details || 'وصف المنتج غير متوفر حالياً.';
      priceEl.textContent = `${product.price || 0}$`;

      const imageFile = product.imgURL;
      if (imageFile) {
        // Depending on DB format it might be a full URL or just the file name. We assume file name here as per index.html.
        if (imageFile.startsWith('http')) {
          imageEl.src = imageFile;
        } else {
          imageEl.src = `${imageFile}`;
        }
      }

      container.style.display = 'grid';

      // Trigger scroll/fade animation manually
      setTimeout(() => container.classList.add('visible'), 50);

    } else if(data.message === "Product not found") {
      loading.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> لم يتم العثور على المنتج';
      loading.style.display = 'block';
    }

  } catch (error) {
    console.error('Error fetching product:', error);
    loading.style.display = 'none';

    // In case the DB is not fully set up or we can't fetch, let's just show the mock product for presentation purposes
    console.log("Showing fallback UI because fetch failed");
    container.style.display = 'grid';
    setTimeout(() => container.classList.add('visible'), 50);
  }
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
      // الزيتونة هنا: لو السيرفر رجع false (يعني التوكن منتهي أو فيه مشكلة)
      console.log("Token is expired or invalid. Clearing localStorage.");
      localStorage.removeItem("token"); // امسح التوكن الميت ده عشان ميبعتوش تاني
    }

  } catch (err) {
    console.error("error:", err);
  }
}

checkUser();