require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const path = require('path');
const cookieParser = require("cookie-parser");
const indexRoute = require('./routes/index.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Express temel ayarları
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

// Veritabanını siktir ettik, ÇORTUR için statik tenant bilgisi
app.locals.tenant = {
    name: 'Çortur Seyahat',
    primaryColor: '#0088CC',
    accentColor: '#D94E1E',
    logo: 'logo.png',
    phone: '0850 000 00 00', // Buraya gerçek numarayı çakarsın
    isGooglePlay: false,
    isAppStore: false
};

// Çerezden kullanıcıyı okuma (Login olunca oBilet'ten dönen datayı buraya gömeceğiz)
app.use((req, res, next) => {
    if (req.cookies && req.cookies.user) {
        try {
            res.locals.user = JSON.parse(req.cookies.user);
        } catch (e) {
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
});

// Bütün yükü çekecek rotalar
app.use('/', indexRoute);

// Motoru çalıştır
app.listen(PORT, () => {
    console.log(`🚍 ${app.locals.tenant.name} fişek gibi aktif: http://localhost:${PORT}`);
});