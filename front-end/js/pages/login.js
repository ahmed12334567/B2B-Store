window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-loaded');
  }, 300);
});
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
      
const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const labelPassword = document.getElementById("labelPassword");
const error = document.getElementById("error");
const errorMessage = document.getElementById("errorMessage");

let isGoogleUser = false;
let googleIdToken = null;

async function submitLoginForm() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/login", { 
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: isGoogleUser ? "" : password.value.trim(), 
        isGoogleUser: isGoogleUser,
        googleIdToken: googleIdToken
      })
    });

    const data = await res.json();
    if (data.success) {
      const token = data.token || (data.data && data.data.token) || (data.user && data.user.token);
      localStorage.setItem("token", token);
      window.location.replace("../index.html");
    } else {
      error.style.display = "block";
      email.style.borderColor = "#dc2626c2";
      if (password) password.style.borderColor = "#dc2626c2";
      errorMessage.innerHTML = `هنالك خطأ في الايميل او الباسورد <i class="fa-solid fa-triangle-exclamation"></i> `;
    }
  } catch (err) {
    console.error("حدث خطأ أثناء الاتصال بالسيرفر:", err);
  }
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  function validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value.trim())) {
      error.style.display = "block";
      errorMessage.innerHTML = `هنالك خطأ في الايميل او الباسورد <i class="fa-solid fa-triangle-exclamation"></i>`;
      email.style.borderColor = "#dc2626c2";
      email.focus();
      return false;
    } else {
      error.style.display = "none";
      return true;
    }
  }

  function validatePassword() {
    if (isGoogleUser) return true;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (password.value.trim() === "") {
      errorMessage.innerHTML = ` هنالك خطأ في الايميل او الباسورد <i class="fa-solid fa-triangle-exclamation"></i>`;
      password.style.borderColor = "#dc2626c2";
      return false;
    } else {
      return true;
    }
  }

  const isvalidateEmail = validateEmail();
  const isvalidatePassword = validatePassword();

  if (isvalidateEmail && isvalidatePassword) {
    await submitLoginForm();
  }
});

window.onload = function () {
  const client = google.accounts.oauth2.initTokenClient({
    client_id: "537019117630-2hebg4ce94j6tio46i4r21iscr9tfpcv.apps.googleusercontent.com",
    scope: "openid profile email",
    ux_mode: "popup",
    callback: (response) => {
      if (response && response.access_token) {
        handleGoogleSuccess(response.access_token);
      }
    },
  });

  const googleBtn = document.getElementById('googleBtn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      client.requestAccessToken();
    });
  }
};

async function handleGoogleSuccess(accessToken) {
  fetch('http://localhost:3000/api/auth/google-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: accessToken })
  })
    .then(res => res.json())
    .then(async (data) => {
      if (data.success) {
        email.value = data.user.email || "";
        email.readOnly = true;
        
        if (password) {
          password.style.display = "none";
          if (labelPassword) labelPassword.style.display = "none";
        }
        
        isGoogleUser = true;
        googleIdToken = accessToken; 
        await submitLoginForm(); 

      } else {
        alert("فشل جلب بيانات جوجل: " + data.message);
      }
    })
    .catch(err => console.error('Error during google-data fetch:', err));
}