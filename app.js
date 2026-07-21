require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const indexRoute = require('./routes/index.js');
const { loadSiteConfig } = require('./utilities/loadSiteConfig');
const { buildDefaultSeo } = require('./utilities/pageSeo');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

// Firma markası ve içerik: config/site.json (API sırları .env'de)
app.locals.tenant = loadSiteConfig();

app.use((req, res, next) => {
    res.locals.pageSeo = buildDefaultSeo(req.app.locals.tenant, req.path);

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

app.use('/', indexRoute);

app.use((req, res) => {
    res.status(404).send('Sayfa bulunamadı.');
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).send('Bir hata oluştu.');
});

app.listen(PORT, () => {
    console.log(`${app.locals.tenant.name} aktif: http://localhost:${PORT}`);
});
