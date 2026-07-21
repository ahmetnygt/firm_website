const fs = require('fs');
const path = require('path');
const { slugify, parseRouteTitle } = require('./pageSeo');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'site.json');

function hexToRgbChannels(hex) {
    const raw = String(hex || '').replace('#', '').trim();
    const full = raw.length === 3
        ? raw.split('').map((c) => c + c).join('')
        : raw;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) {
        return '0, 136, 204';
    }
    const n = parseInt(full, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function phoneDigits(phone) {
    return String(phone || '').replace(/\D/g, '');
}

function fillPlaceholders(value, name) {
    if (typeof value === 'string') {
        return value.replace(/\{\{name\}\}/g, name);
    }
    if (Array.isArray(value)) {
        return value.map((item) => fillPlaceholders(item, name));
    }
    if (value && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = fillPlaceholders(v, name);
        }
        return out;
    }
    return value;
}

function imagePath(filename, fallback) {
    const file = filename || fallback;
    if (!file) return '';
    if (file.startsWith('/') || file.startsWith('http')) return file;
    return `/images/${file}`;
}

function loadSiteConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        throw new Error(
            `Firma config bulunamadı: ${CONFIG_PATH}\n` +
            'config/site.example.json dosyasını site.json olarak kopyalayıp doldurun.'
        );
    }

    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const name = raw.name || 'Firma';
    const filled = fillPlaceholders(raw, name);
    const phone = filled.phone || '';

    const branches = (filled.branches || []).map((branch) => ({
        ...branch,
        phone: branch.phone || phone,
    }));

    const logo = imagePath(filled.logo, 'logo.png');
    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');

    const popularCities = (filled.popularCities || []).map((city) => {
        const parsed = parseRouteTitle(city.title);
        const from = city.from || parsed.from;
        const to = city.to || parsed.to;
        const slug = city.slug || slugify(`${from}-${to}` || city.title);
        const href = (!city.href || city.href === '#')
            ? `/rota/${slug}`
            : city.href;

        return {
            ...city,
            from,
            to,
            slug,
            href,
            image: imagePath(city.image, 'route-2.png'),
            metaDescription: city.metaDescription
                || `${from} - ${to} otobüs bileti: ${name} ile online, güvenli ve konforlu seyahat. Güncel sefer saatleri ve fiyatlar.`,
        };
    });

    const orgSchema = {
        '@context': 'https://schema.org',
        '@type': ['Organization', 'TravelAgency'],
        name,
        legalName: filled.legalName || name,
        url: siteUrl || undefined,
        logo: siteUrl ? `${siteUrl}${logo}` : logo,
        telephone: phone || undefined,
        areaServed: 'TR',
        priceRange: '$$',
    };

    const primaryBranch = branches.find((b) => b.address) || branches[0];
    if (primaryBranch?.address) {
        orgSchema.address = {
            '@type': 'PostalAddress',
            streetAddress: primaryBranch.address,
            addressCountry: 'TR',
        };
    }

    return {
        name,
        legalName: filled.legalName || name,
        primaryColor: filled.primaryColor || '#0088CC',
        accentColor: filled.accentColor || '#D94E1E',
        primaryRgb: hexToRgbChannels(filled.primaryColor || '#0088CC'),
        logo,
        logoAbsolute: siteUrl ? `${siteUrl}${logo}` : logo,
        heroImage: imagePath(filled.heroImage, 'hero-bg.webp'),
        corporateImage: imagePath(filled.corporateImage, 'corporate_img.webp'),
        phone,
        phoneDigits: phoneDigits(phone),
        siteUrl,
        metaDescription: filled.metaDescription
            || `${name} ile Türkiye'nin her yerine online, ucuz ve güvenli otobüs bileti al.`,
        hero: filled.hero || { title: '', subtitle: '' },
        features: filled.features || [],
        campaigns: filled.campaigns || { title: '', subtitle: '', items: [] },
        popularCities,
        faq: filled.faq || [],
        faqJsonLd: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: (filled.faq || []).map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
        }),
        orgJsonLd: JSON.stringify(orgSchema),
        trustBadges: filled.trustBadges || [],
        corporate: filled.corporate || {
            heroSubtitle: '',
            intro: '',
            closing: '',
            features: [],
        },
        branches,
    };
}

module.exports = { loadSiteConfig, CONFIG_PATH };
