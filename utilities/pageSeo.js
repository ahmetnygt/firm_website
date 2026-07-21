function slugify(text) {
    const map = {
        ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i',
        ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
    };
    return String(text || '')
        .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (ch) => map[ch] || ch)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function toTitleCase(text) {
    return String(text || '')
        .toLocaleLowerCase('tr-TR')
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
        .join(' ');
}

function parseRouteTitle(title) {
    const parts = String(title || '').split('-').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
        return {
            from: toTitleCase(parts[0]),
            to: toTitleCase(parts.slice(1).join('-')),
        };
    }
    return { from: toTitleCase(title), to: '' };
}

function buildDefaultSeo(tenant, reqPath = '/') {
    const path = reqPath === '/' ? '' : reqPath;
    const canonical = tenant.siteUrl ? `${tenant.siteUrl}${path}` : '';
    return {
        title: `${tenant.name} – Güvenli ve Hızlı Otobüs Bileti`,
        description: tenant.metaDescription,
        canonical,
        robots: 'index, follow',
        ogType: 'website',
        ogImage: tenant.logoAbsolute || '',
    };
}

function setPageSeo(res, overrides = {}) {
    res.locals.pageSeo = {
        ...(res.locals.pageSeo || {}),
        ...overrides,
    };
}

module.exports = {
    slugify,
    toTitleCase,
    parseRouteTitle,
    buildDefaultSeo,
    setPageSeo,
};
