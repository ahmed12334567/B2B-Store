window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-loaded');
  }, 300);
});

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

const form = document.getElementById("registerForm");
const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const labelPassword = document.getElementById("passwrodLabel");
const confirmPassword = document.getElementById("confirmPassword");
const labelConfirmPassword = document.getElementById("confirmPasswordLabel");
const locationBtn = document.getElementById('getLocationBtn');
const addressInput = document.getElementById('address');
const phoneInput = document.getElementById("phone");
const error = document.getElementById("error");
const errorMessage = document.getElementById("errorMessage");

let isGoogleUser = false;
let googleIdToken = null; // متغير لحفظ التوكن الآمن القادم من جوجل

async function submitRegasterForm() {
  try {
    const payload = {
        name: username.value.trim(),
        email: email.value.trim(),
        password: password.value.trim(),
        confirmPassword: confirmPassword.value.trim(),
        location: addressInput.value.trim(),
        phone: phoneInput.value.trim(),
        isGoogleUser: isGoogleUser,
        googleIdToken: googleIdToken
    };
    
    console.log("البيانات المرسلة للسيرفر: ", payload); // للـ Debugging

    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("رد السيرفر: ", data); // للـ Debugging
 
    if (data.success) {
      const token = data.token || (data.user && data.user.token);
      localStorage.setItem("token", token);
      window.location.replace("../index.html");
    } else {
      error.style.display = "block";
      // عرض رسالة الخطأ القادمة من السيرفر مباشرة لنعرف السبب
      errorMessage.textContent ="تأكد من إدخال كل البيانات بشكل صحيح";
    }
  } catch (err) {
    console.error("مشكلة في الاتصال بالسيرفر: ", err);
  }
}

// --------------------------------------------------------
// تعديل: نقل حدث زر الموقع الجغرافي خارج حدث الـ Submit تماماً
// --------------------------------------------------------
if (locationBtn) {
  locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      locationBtn.classList.add('animate-spin', 'text-blue-500');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
            const data = await response.json();

            const addressData = data.address;
            const city = addressData.city || addressData.town || addressData.state || "من فضلك ادخل العنوان يدوياً";
            const region = addressData.suburb || addressData.neighbourhood || addressData.county || "";

            if (region) {
              addressInput.value = `${city}، ${region}`;
            } else {
              addressInput.value = city;
            }
            validationLocation();
          } catch (err) {
            console.error("حدث خطأ أثناء جلب اسم العنوان:", err);
            addressInput.value = "من فضلك ادخل العنوان يدوياً";
          } finally {
            locationBtn.classList.remove('animate-spin', 'text-blue-500');
          }
        },
        (err) => {
          alert('عذراً، لم نتمكن من تحديد موقعك. يرجى تفعيل الـ GPS وإعطاء صلاحية الموقع للمتصفح.');
          locationBtn.classList.remove('animate-spin', 'text-blue-500');
        }
      );
    } else {
      alert('متصفحك لا يدعم خاصية تحديد الموقع.');
    }
  });
}

// دالات التحقق الخارجية (Helper Validation Functions)
function validateUsername() {
  if (username.value.trim() === "" || username.value.trim().length < 3) {
    error.style.display = "block";
    errorMessage.textContent = "تأكد من إدخال اسم مستخدم صحيح (3 أحرف على الأقل)";
    username.style.borderColor = "red";
    username.style.borderWidth = "2px";
    return false;
  } else {
    username.style.borderColor = "green";
    username.style.borderWidth = "2px";
    return true;
  }
}

function validateEmail() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value.trim())) {
    error.style.display = "block";
    errorMessage.textContent = "تأكد من إدخال بريد إلكتروني صحيح";
    email.style.borderColor = "red";
    email.style.borderWidth = "2px";
    return false;
  } else {
    email.style.borderColor = "green";
    email.style.borderWidth = "2px";
    return true;
  }
}

function validatePassword() {
  if (isGoogleUser) return true; // تخطي الفحص إذا كان مستخدم جوجل

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password.value.trim())) {
    error.style.display = "block";
    errorMessage.textContent = "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام";
    password.style.borderColor = "red";
    password.style.borderWidth = "2px";
    return false;
  } else {
    password.style.borderColor = "green";
    password.style.borderWidth = "2px";
    return true;
  }
}

function validateConfirmPassword() {
  if (isGoogleUser) return true;

  if (confirmPassword.value.trim() === "" || confirmPassword.value !== password.value) {
    error.style.display = "block";
    errorMessage.textContent = "كلمتا المرور غير متطابقتين";
    confirmPassword.style.borderColor = "red";
    confirmPassword.style.borderWidth = "2px";
    return false;
  } else {
    confirmPassword.style.borderColor = "green";
    confirmPassword.style.borderWidth = "2px";
    return true;
  }
}

function validationLocation() {
  if (addressInput.value.trim() === "") {
    error.style.display = "block";
    errorMessage.textContent = "يرجى تحديد الموقع أو كتابته يدوياً";
    addressInput.style.borderColor = "red";
    addressInput.style.borderWidth = "2px";
    return false;
  } else {
    addressInput.style.borderColor = "green";
    addressInput.style.borderWidth = "2px";
    return true;
  }
}

function validationPhoneNumber() {
  const phoneRegex = /^01[0125][0-9]{8}$/;
  if (phoneInput.value.trim() === "" || !phoneRegex.test(phoneInput.value.trim())) {
    error.style.display = "block";
    errorMessage.textContent = "رقم الهاتف غير صحيح (يجب أن يكون رقم مصري مكون من 11 رقم)";
    phoneInput.style.borderColor = "red";
    phoneInput.style.borderWidth = "2px";
    return false;
  } else {
    phoneInput.style.borderColor = "green";
    phoneInput.style.borderWidth = "2px";
    return true;
  }
}

// حدث إرسال النموذج الأساسي
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const isValidateUsername = validateUsername();
  const isValidateEmail = validateEmail();
  const isValidatePassword = validatePassword();
  const isValidateConfirmPassword = validateConfirmPassword();
  const isValidateLocation = validationLocation();
  const isValidatePhoneNumber = validationPhoneNumber();

  if (isValidateUsername && isValidateEmail && isValidatePassword && isValidateConfirmPassword && isValidateLocation && isValidatePhoneNumber) {
    error.style.display = "none";
    errorMessage.textContent = "";
    await submitRegasterForm();
  }
});

window.onload = function () {
  // تنويه: تأكد من تحديث الـ Client ID في البيئة الإنتاجية
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
        username.value = data.user.name || "";
        email.value = data.user.email || "";
        addressInput.value = data.user.location || "";
        phoneInput.value = data.user.phone || "";
        
        username.readOnly = true;
        email.readOnly = true;
        
        if (password) {
          password.style.display = "none";
          if (labelPassword) labelPassword.style.display = "none";
        }
        if (confirmPassword) {
          confirmPassword.style.display = "none";
          if (labelConfirmPassword) labelConfirmPassword.style.display = "none";
        }
        
        // تعديل أمني: حفظ التوكن لإرساله لاحقاً في الـ Register Route
        isGoogleUser = true;
        googleIdToken = accessToken; 

        // إذا كانت بيانات الهاتف والموقع فارغة، لا تقم بالتسجيل التلقائي؛ دع المستخدم يكملها واضغط تسجيل يدوياً.
        if (addressInput.value && phoneInput.value) {
            await submitRegasterForm();
        } else {
            alert("يرجى إكمال الحقول المتبقية (العنوان ورقم الهاتف) لإتمام التسجيل بجوجل.");
        }
      } else {
        alert("فشل جلب بيانات جوجل: " + data.message);
      }
    })
    .catch(err => console.error('Error during google-data fetch:', err));
}