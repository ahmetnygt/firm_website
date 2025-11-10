const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Tenant conf
const tenant = {
    slug: 'corutr',
    name: 'Çortur',
    primaryColor: '#f15a24',
    accentColor: '#004d7a',
    logo: '/images/logo.png',
    phone: '0 (549) 790 00 17',
    apiBase: 'https://api.example.com/anafartalar',
    isGooglePlay: true,
    isAppStore: true,
};

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Mock data
const cities = ['Çanakkale', 'İstanbul', 'Bursa', 'İzmir', 'Ankara'];
const popular = [
    { from: 'Çanakkale', to: 'İstanbul', price: 1100 },
    { from: 'Çanakkale', to: 'Bursa', price: 599 },
    { from: 'İstanbul', to: 'Ankara', price: 450 },
    { from: 'İzmir', to: 'Çanakkale', price: 750 }
];
const steps = [
    { icon: 'bi-geo-alt', title: 'Güzergah Seçin' },
    { icon: 'bi-calendar-date', title: 'Tarih Belirleyin' },
    { icon: 'bi-credit-card', title: 'Ödeme Yapın' },
    { icon: 'bi-qr-code', title: 'Biletinizi Alın' }
];
const destinations = ['Çanakkale', 'İstanbul', 'Bursa', 'İzmir', 'Ankara', 'Gelibolu', 'Beylikdüzü'];
const faq = [
    { q: 'Bileti nasıl alabilirim?', a: '4 adımda online olarak satın alabilirsiniz.' },
    { q: 'İptal süreci nedir?', a: 'Kalkışa 24 saat kala ücretsiz iptal.' },
    { q: 'Yolculuk süresi?', a: 'Rota ve trafiğe göre değişir, ortalama 6 saat.' },
    { q: 'Evcil hayvan kabulü?', a: 'Küçük boy köpekler taşıma kabul edilir.' }
];

app.get('/', (req, res) => res.render('index', { tenant, cities, popular, steps, destinations, faq }));
app.get('/search', (req, res) => res.json({ query: req.query, result: [] })); // simülasyon

app.listen(PORT, () => console.log(`Running http://localhost:${PORT}`));