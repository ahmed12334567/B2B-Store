const errorModal     = document.getElementById('errorModal');
const errorTitleEl   = document.getElementById('errorTitle');
const errorMessageEl = document.getElementById('errorMessage');
let errorRedirectUrl = null;

function showErrorModal(title, message, redirectUrl = null) {
  if (errorTitleEl) errorTitleEl.textContent = title;
  if (errorMessageEl) errorMessageEl.textContent = message;
  errorRedirectUrl = redirectUrl;
  errorModal?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeErrorModal() {
  errorModal?.classList.remove('open');
  document.body.style.overflow = '';
  const redirect = errorRedirectUrl;
  errorRedirectUrl = null;
  if (redirect) window.location.href = redirect;
}

document.getElementById('closeModalError')?.addEventListener('click', closeErrorModal);
errorModal?.addEventListener('click', (e) => {
  if (e.target === errorModal) closeErrorModal();
});

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
  const buyButton = document.getElementById("btn-buy-large") 
  const titleEl = document.getElementById('product-title');
  const descEl = document.getElementById('product-desc');
  const priceEl = document.getElementById('product-price');
  const oldPrice = document.getElementById("product-old-price")
  const imageEl = document.getElementById('product-image');
buyButton.setAttribute("data-product-id", productId)
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
    loading.style.display = 'none';
    showErrorModal('المنتج غير محدد', 'لم يتم تحديد معرّف المنتج. يرجى العودة واختيار منتج.', '../index.html');
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
            const productTitle = product.name || product.product_name || product.title || 'اسم المنتج غير متوفر';
      titleEl.textContent = productTitle;
      document.title = productTitle + ' - B2B Store';
      descEl.textContent = product.description || product.details || 'وصف المنتج غير متوفر حالياً.';
      priceEl.textContent = `${product.price || 0}$`;
        const originalPrice = Number(product.price);
        const discountedPrice = originalPrice + (originalPrice * 20 / 100);
      oldPrice.textContent = `${discountedPrice}$`
      const imageFile = product.imgURL;
      if (imageFile) {
        // Depending on DB format it might be a full URL or just the file name. We assume file name here as per index.html.
        if (imageFile.startsWith('http')) {
          imageEl.src = imageFile;
        } else {
          imageEl.src = `${imageFile}`;
        }
      }

      // Set product ID on add-to-cart button for cart.js
      const addCartBtn = document.getElementById('btn-add-cart');
      if (addCartBtn) addCartBtn.dataset.productId = productId;

      container.style.display = 'grid';

      // Trigger scroll/fade animation manually
      setTimeout(() => container.classList.add('visible'), 50);

    } else if (data.message === "Product not found") {
      showErrorModal('المنتج غير موجود', 'لم يتم العثور على المنتج المطلوب. يرجى التحقق من الرابط أو العودة للمتجر.', '../index.html');
    } else {
      showErrorModal('تعذّر تحميل المنتج', data.message || 'حدث خطأ أثناء جلب بيانات المنتج.');
    }

  } catch (error) {
    console.error('Error fetching product:', error);
    loading.style.display = 'none';
    showErrorModal('خطأ في الاتصال', 'تعذر الاتصال بالسيرفر. يرجى المحاولة لاحقاً.');
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
      console.log("Token is expired or invalid. Clearing localStorage.");
      localStorage.removeItem("token");
    }

  } catch (err) {
    console.error("error:", err);
  }
}


checkUser();
function isTokenExpired(token) {
    if (!token) return true;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    } catch (e) {
        return true;
    }
}

document.getElementById('btn-buy-large').addEventListener('click', function () {
  const token = localStorage.getItem('token');

  if (token && !isTokenExpired(token)) {
    const id = this.dataset.productId;
    window.location.href = `order.html?id=${id}`;
  } else {
    localStorage.removeItem('token');
    showErrorModal(
      'يجب تسجيل الدخول',
      'جلسة العمل انتهت أو غير موجودة. يرجى تسجيل الدخول للمتابعة.',
      'login.html'
    );
  }
});