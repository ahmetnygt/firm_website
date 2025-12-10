require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const path = require('path');
const cookieParser = require("cookie-parser")
const { connectDbs, firmDb, goturDb } = require('./utilities/db.js');
const initModels = require('./utilities/initModels.js');
const indexRoute = require('./routes/index.js');

const app = express();
const PORT = process.env.PORT || 5000;
const tenantKey = 'anafartalar';
app.locals.tenantKey = tenantKey;

// Express ayarları
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(express.json());

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

// Tenant bilgisi yükleme fonksiyonu
async function loadTenantInfo(tenantKey, goturDb) {
    try {
        const [rows] = await goturDb.query(
            'SELECT * FROM Firms WHERE `key` = ? LIMIT 1',
            { replacements: [tenantKey] }
        );

        if (!rows || rows.length === 0) return null;
        const firm = rows[0];

        return {
            slug: firm.key,
            name: firm.displayName,
            primaryColor: firm.primaryColor || '#2660ff',
            accentColor: firm.accentColor || '#004d7a',
            logo: 'logo.png',
            phone: firm.phone || null,
            isGooglePlay: firm.isGooglePlay || false,
            isAppStore: firm.isAppStore || false,
        };
    } catch (err) {
        console.error('❌ Tenant bilgisi alınamadı:', err.message);
        return null;
    }
}

// Başlat
(async () => {
    await connectDbs();

    const tenant = await loadTenantInfo(tenantKey, goturDb);
    app.locals.tenant = tenant || { name: 'Bilinmeyen Firma' };

    const firmModels = initModels(firmDb);
    app.locals.models = firmModels;
    app.locals.goturDb = goturDb;

    app.use('/', indexRoute);

    app.listen(PORT, () => {
        console.log(`🚍 ${tenant?.name || tenantKey} aktif: http://localhost:${PORT}`);
    });
})();