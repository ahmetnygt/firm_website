// =============================
//  G T R   H O M E   S E A R C H
// =============================

// Elementler
const todayBtn = document.querySelector('.today');
const tomorrowBtn = document.querySelector('.tomorrow');
const dateInput = document.getElementById('date');
const searchButton = document.querySelector("#searchForm button[type='submit']");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");

// =============================
// FLATPICKR (DÜZELTİLMİŞ)
// =============================

const fp = flatpickr(dateInput, {
  locale: 'tr',

  // 👇 Kullanıcıya görünen format
  altInput: true,
  altFormat: "d.m.Y",

  // 👇 Gerçek input value
  dateFormat: "Y-m-d",

  allowInput: true,
  minDate: 'today',
  defaultDate: "today"
});

// =============================
// BUGÜN – YARIN TUŞLARI
// =============================
if (todayBtn) {
  todayBtn.addEventListener("click", (e) => {
    e.preventDefault();
    fp.setDate(new Date(), true);
  });
}

if (tomorrowBtn) {
  tomorrowBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const d = new Date();
    d.setDate(d.getDate() + 1);
    fp.setDate(d, true);
  });
}

// =============================
// AYNI ŞEHİR SEÇİLEMEZ
// =============================
function validateDifferentCities() {
  const from = fromSelect?.value;
  const to = toSelect?.value;

  if (from && to && from === to) {
    alert("Kalkış ve varış aynı şehir olamaz!");
    return false;
  }
  return true;
}

fromSelect?.addEventListener("change", validateDifferentCities);
toSelect?.addEventListener("change", validateDifferentCities);

// =============================
// ARA BUTONU
// =============================
if (searchButton) {
  searchButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const from = fromSelect?.value;
    const to = toSelect?.value;
    const date = dateInput.value; // 👈 GERÇEK FORMAT: 2025-11-22

    if (!from || !to || !date) {
      alert("Lütfen kalkış, varış ve tarih seçin.");
      return;
    }

    if (!validateDifferentCities()) return;

    // 🔥 Format artık doğru gidiyor: YYYY-MM-DD
    window.location.href = `/trips?from=${from}&to=${to}&date=${date}`;
  });
}

$(document).ready(function () {
  // Navbar güncelleme fonksiyonu (checkAuthStatus) artık gereksiz, PUG hallediyor.

  // 1. Giriş Yap Formu
  $("#loginForm").on("submit", async function (e) {
    e.preventDefault();

    const btn = $(this).find('button[type="submit"]');
    const spinner = btn.find('.spinner-border');
    const textSpan = btn.find('.text-btn');

    const idNumber = $(this).find('[name="idNumber"]').val().trim();
    const password = $(this).find('[name="password"]').val();

    // UI Kilitle
    setLoading(btn, true);

    try {
      const res = await $.ajax({
        url: "/login",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ idNumber, password })
      });

      if (res.success) {
        // Backend cookie'yi ayarladı, sayfayı yenilemek yeterli
        window.location.reload();
      }
    } catch (err) {
      let msg = err.responseJSON?.error || "Giriş yapılamadı.";
      alert(msg);
    } finally {
      setLoading(btn, false);
    }
  });

  // 2. Kayıt Ol Formu
  $("#registerForm").on("submit", async function (e) {
    e.preventDefault();

    const btn = $(this).find('button[type="submit"]');

    const formData = {
      name: $(this).find('[name="name"]').val().trim(),
      surname: $(this).find('[name="surname"]').val().trim(),
      phone: $(this).find('[name="phone"]').val().trim(),
      idNumber: $(this).find('[name="idNumber"]').val().trim(),
      email: $(this).find('[name="email"]').val().trim(),
      gender: $(this).find('[name="gender"]:checked').val(),
      password: $(this).find('[name="password"]').val()
    };

    if (formData.idNumber.length !== 11) {
      alert("T.C. Kimlik Numarası 11 haneli olmalıdır.");
      return;
    }

    setLoading(btn, true);

    try {
      const res = await $.ajax({
        url: "/register",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(formData)
      });

      if (res.success) {
        alert("Kayıt başarılı! Giriş yapıldı.");
        window.location.reload();
      }
    } catch (err) {
      let msg = err.responseJSON?.error || "Kayıt sırasında bir hata oluştu.";
      alert(msg);
    } finally {
      setLoading(btn, false);
    }
  });
});

function setLoading(btn, isLoading) {
  const spinner = btn.find('.spinner-border');
  const textSpan = btn.find('.text-btn');

  if (isLoading) {
    btn.prop('disabled', true);
    spinner.removeClass('d-none');
    textSpan.addClass('d-none');
  } else {
    btn.prop('disabled', false);
    spinner.addClass('d-none');
    textSpan.removeClass('d-none');
  }
}