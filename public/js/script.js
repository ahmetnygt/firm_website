// main.js

// Elementler
const todayBtn = document.querySelector('.today');
const tomorrowBtn = document.querySelector('.tomorrow');
const dateInput = document.getElementById('date');
const searchForm = document.getElementById('searchForm');

// Flatpickr başlatma (tek örnek)
const fp = flatpickr(dateInput, {
  locale: 'tr',               // Türkçe
  dateFormat: 'd.m.Y',        // Görünen format
  altInput: false,            // alternatif input istemiyorsak false
  allowInput: true,
  minDate: 'today',
  clickOpens: true,
  defaultDate: "today",
  wrap: false,                // input wrap değil, doğrudan input kullanılıyor
  onReady(selectedDates, dateStr, instance) {
    // Eğer input başlangıçta boşsa bir değer atamak istemezsek burayı boş bırak.
    // İstersen default set için uncomment:
    // if (!instance.input.value) instance.setDate(new Date(), false);
  }
});

// Hızlı tarih butonları - flatpickr instance kullanarak ayarla
if (todayBtn) {
  todayBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fp.setDate(new Date(), true); // ikinci arg true -> input güncellenir, change event tetiklenir
    // fp.open(); // istersen buton tıklayınca takvim açılmasını sağlayabilirsin
  });
}

if (tomorrowBtn) {
  tomorrowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const d = new Date();
    d.setDate(d.getDate() + 1);
    fp.setDate(d, true);
    // fp.open();
  });
}

// Sefer ara - form submit
if (searchForm) {
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // FormData doğrudan date inputun güncellenmiş değerini alır
    const formData = new FormData(searchForm);

    // flatpickr inputu bazı durumlarda boş olabilir; güvenlik için fp.input.value'yu da al
    if (!formData.get('date') && fp && fp.input) {
      formData.set('date', fp.input.value);
    }

    const params = new URLSearchParams(formData).toString();
    try {
      const res = await fetch('/search?' + params, { method: 'GET' });
      // Eğer backend json dönüyorsa:
      const json = await res.json();
      console.log('Search response:', json);
      // TODO: listeleme/sonuç sayfasına yönlendirme veya sonuç gösterimi burada yapılır.
    } catch (err) {
      console.error('Search error:', err);
    }
  });
}
