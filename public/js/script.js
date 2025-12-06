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
