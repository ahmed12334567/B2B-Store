// ========================================
// ADMIN LOGIN PAGE — JavaScript
// ========================================

// Page load animation
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-loaded');
  }, 300);
});

// Theme toggle
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

// Form elements
const form = document.getElementById("adminLoginForm");
const email = document.getElementById("adminEmail");
const password = document.getElementById("adminPassword");
const error = document.getElementById("error");
const errorMessage = document.getElementById("errorMessage");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");
const submitBtn = document.getElementById("adminSubmitBtn");

// Validation helpers
function validateEmail() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value.trim())) {
    error.style.display = "block";
    errorMessage.innerHTML = `البريد الإلكتروني غير صالح <i class="fa-solid fa-triangle-exclamation"></i>`;
    email.style.borderColor = "#dc2626c2";
    email.focus();
    return false;
  } else {
    email.style.borderColor = "";
    return true;
  }
}

function validatePassword() {
  if (password.value.trim() === "" || password.value.trim().length < 8) {
    error.style.display = "block";
    errorMessage.innerHTML = `كلمة المرور يجب أن تكون 8 أحرف على الأقل <i class="fa-solid fa-triangle-exclamation"></i>`;
    password.style.borderColor = "#dc2626c2";
    return false;
  } else {
    password.style.borderColor = "";
    return true;
  }
}

// Show / hide loading state
function setLoading(isLoading) {
  if (isLoading) {
    btnText.style.display = "none";
    btnSpinner.style.display = "inline-block";
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";
  } else {
    btnText.style.display = "inline";
    btnSpinner.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
  }
}

// Submit admin login
async function submitAdminLogin() {
  setLoading(true);
  try {
    const res = await fetch("http://localhost:3000/api/auth/login/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value.trim()
      })
    });

    const data = await res.json();

    if (data.success) {
      const token = data.data?.token || data.token;
      localStorage.setItem("adminToken", token);
      // Redirect to admin dashboard
      window.location.replace("dashboard.html");
    } else {
      error.style.display = "block";
      email.style.borderColor = "#dc2626c2";
      password.style.borderColor = "#dc2626c2";

      const msg = "خطأ في البريد الإلكتروني أو كلمة المرور";
      errorMessage.innerHTML = `${msg} <i class="fa-solid fa-triangle-exclamation"></i>`;
    }
  } catch (err) {
    console.error("حدث خطأ أثناء الاتصال بالسيرفر:", err);
    error.style.display = "block";
    errorMessage.innerHTML = `تعذر الاتصال بالسيرفر <i class="fa-solid fa-triangle-exclamation"></i>`;
  } finally {
    setLoading(false);
  }
}

// Clear errors on input
email.addEventListener("input", () => {
  email.style.borderColor = "";
  error.style.display = "none";
});

password.addEventListener("input", () => {
  password.style.borderColor = "";
  error.style.display = "none";
});

// Form submission
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Reset error state
  error.style.display = "none";

  const isValidEmail = validateEmail();
  const isValidPassword = validatePassword();

  if (isValidEmail && isValidPassword) {
    await submitAdminLogin();
  }
});
