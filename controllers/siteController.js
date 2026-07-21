const goturApi = require("../utilities/goturApi");
const { setPageSeo } = require("../utilities/pageSeo");

const USER_COOKIE_OPTS = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
};

function parseJsonArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return [];
        }
    }
    return [];
}

function getAuthSession(req) {
    if (!req.cookies?.user) return null;
    try {
        const session = JSON.parse(req.cookies.user);
        if (!session?.token || !session?.id) return null;
        return session;
    } catch {
        return null;
    }
}

function setUserCookie(res, user, token) {
    const { password, ...safeUser } = user;
    res.cookie("user", JSON.stringify({ ...safeUser, token }), USER_COOKIE_OPTS);
}

function normalizeStopTitle(title) {
    return String(title || "")
        .toLocaleLowerCase("tr-TR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function findStopId(cities, label) {
    const needle = normalizeStopTitle(label);
    if (!needle) return null;

    const exact = cities.find((c) => normalizeStopTitle(c.title) === needle);
    if (exact) return exact.placeId;

    const partial = cities.find((c) => {
        const hay = normalizeStopTitle(c.title);
        return hay.includes(needle) || needle.includes(hay);
    });
    return partial?.placeId || null;
}

exports.getHomePage = async (req, res) => {
    const tenant = req.app.locals.tenant;
    setPageSeo(res, {
        title: `${tenant.name} – Online Otobüs Bileti | Güvenli ve Hızlı`,
        description: tenant.metaDescription,
        canonical: tenant.siteUrl || undefined,
    });

    try {
        const apiRes = await goturApi.getStops();
        const rawCities = apiRes?.stops || [];

        const cities = rawCities.map(c => ({
            placeId: c.placeId,
            title: c.title,
        })).sort((a, b) => a.title.localeCompare(b.title));

        return res.render("index", {
            cities,
            destinations: cities.slice(0, 10).map(c => c.title),
        });
    } catch (err) {
        console.error("Anasayfa durakları çekilirken hata:", err.message);
        return res.render("index", {
            cities: [], destinations: [],
        });
    }
};

exports.getCorporatePage = (req, res) => {
    const tenant = req.app.locals.tenant;
    setPageSeo(res, {
        title: `Kurumsal | ${tenant.name}`,
        description: `${tenant.legalName} hakkında bilgi. ${tenant.corporate?.heroSubtitle || tenant.metaDescription}`,
        canonical: tenant.siteUrl ? `${tenant.siteUrl}/corporate` : undefined,
    });
    return res.render("corporate");
};

exports.getBranchesPage = (req, res) => {
    const tenant = req.app.locals.tenant;
    setPageSeo(res, {
        title: `Şubelerimiz & İletişim | ${tenant.name}`,
        description: `${tenant.name} şube adresleri, telefon numaraları ve iletişim bilgileri.`,
        canonical: tenant.siteUrl ? `${tenant.siteUrl}/branches` : undefined,
    });
    return res.render("branches", {
        branches: tenant.branches || [],
    });
};

exports.getRoutePage = async (req, res) => {
    const tenant = req.app.locals.tenant;
    const route = (tenant.popularCities || []).find((c) => c.slug === req.params.slug);

    if (!route) {
        setPageSeo(res, {
            title: `Sayfa bulunamadı | ${tenant.name}`,
            robots: "noindex, follow",
            canonical: undefined,
        });
        return res.status(404).render("legal", {
            legalTitle: "Sayfa bulunamadı",
            legalParagraphs: ["Aradığınız rota sayfası mevcut değil."],
        });
    }

    setPageSeo(res, {
        title: `${route.from} - ${route.to} Otobüs Bileti | ${tenant.name}`,
        description: route.metaDescription,
        canonical: tenant.siteUrl ? `${tenant.siteUrl}/rota/${route.slug}` : undefined,
        ogImage: tenant.siteUrl && route.image?.startsWith("/")
            ? `${tenant.siteUrl}${route.image}`
            : (route.image?.startsWith("http") ? route.image : tenant.logoAbsolute),
    });

    let cities = [];
    let fromId = null;
    let toId = null;

    try {
        const apiRes = await goturApi.getStops();
        cities = (apiRes?.stops || []).map((c) => ({
            placeId: c.placeId,
            title: c.title,
        })).sort((a, b) => a.title.localeCompare(b.title, "tr"));

        fromId = findStopId(cities, route.from);
        toId = findStopId(cities, route.to);
    } catch (err) {
        console.error("Rota sayfası durakları çekilirken hata:", err.message);
    }

    const routeJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        name: `${route.from} - ${route.to} Otobüs Bileti`,
        description: route.metaDescription,
        provider: {
            "@type": "TravelAgency",
            name: tenant.name,
            url: tenant.siteUrl || undefined,
        },
        areaServed: [route.from, route.to],
        url: tenant.siteUrl ? `${tenant.siteUrl}/rota/${route.slug}` : undefined,
    });

    return res.render("route", {
        route,
        cities,
        fromId,
        toId,
        routeJsonLd,
    });
};

exports.getLegalPage = (req, res) => {
    const tenant = req.app.locals.tenant;
    const pages = {
        gizlilik: {
            title: `Gizlilik Politikası | ${tenant.name}`,
            heading: "Gizlilik Politikası",
            description: `${tenant.name} gizlilik politikası ve kişisel verilerin korunması hakkında bilgi.`,
            path: "/gizlilik",
            body: [
                `${tenant.legalName || tenant.name} olarak web sitemizi ziyaret ettiğinizde paylaştığınız kişisel verilerin gizliliğine önem veriyoruz.`,
                "Bilet işlemleri, üyelik ve müşteri hizmetleri süreçlerinde ad, soyad, iletişim ve kimlik bilgileriniz yalnızca hizmetin sunulması amacıyla işlenir.",
                "Verileriniz üçüncü taraflarla pazarlama amacıyla paylaşılmaz. Yasal yükümlülükler ve ödeme altyapısı gereği zorunlu aktarımlar hariç tutulur.",
                "Haklarınız için bizimle iletişim kanallarımız üzerinden iletişime geçebilirsiniz.",
            ],
        },
        "kullanim-kosullari": {
            title: `Kullanım Koşulları | ${tenant.name}`,
            heading: "Kullanım Koşulları",
            description: `${tenant.name} web sitesi kullanım koşulları ve online bilet işlem kuralları.`,
            path: "/kullanim-kosullari",
            body: [
                `Bu web sitesini kullanarak ${tenant.name} online bilet hizmetlerinin kullanım koşullarını kabul etmiş sayılırsınız.`,
                "Sefer bilgileri, fiyatlar ve koltuk müsaitliği anlık olarak değişebilir. Satın alma / rezervasyon tamamlanana kadar kesin işlem oluşmaz.",
                "Yolcu bilgilerinin doğru girilmesi kullanıcının sorumluluğundadır. Hatalı bilgilerden doğan aksaklıklardan site sorumlu tutulamaz.",
                "İptal ve iade koşulları ilgili sefer ve bilet kurallarına tabidir.",
            ],
        },
        "cerez-politikasi": {
            title: `Çerez Politikası | ${tenant.name}`,
            heading: "Çerez Politikası",
            description: `${tenant.name} çerez politikası: oturum, güvenlik ve site deneyimi çerezleri.`,
            path: "/cerez-politikasi",
            body: [
                "Sitemiz, oturum yönetimi, güvenlik ve temel işlevsellik için zorunlu çerezler kullanır.",
                "Giriş yaptığınızda üyelik oturumunuzun sürdürülmesi için çerezler saklanabilir.",
                "Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz; bazı çerezleri kapatmak site işlevlerini etkileyebilir.",
                "Analitik veya pazarlama çerezleri kullanılması halinde ayrıca bilgilendirme yapılır.",
            ],
        },
    };

    const page = pages[req.params.slug];
    if (!page) {
        return res.status(404).send("Sayfa bulunamadı.");
    }

    setPageSeo(res, {
        title: page.title,
        description: page.description,
        canonical: tenant.siteUrl ? `${tenant.siteUrl}${page.path}` : undefined,
    });

    return res.render("legal", {
        legalTitle: page.heading,
        legalParagraphs: page.body,
    });
};

exports.getRobotsTxt = (req, res) => {
    const tenant = req.app.locals.tenant;
    const sitemapUrl = tenant.siteUrl
        ? `${tenant.siteUrl}/sitemap.xml`
        : "/sitemap.xml";

    const body = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /payment",
        "Disallow: /profile",
        "Disallow: /my-tickets",
        "Disallow: /api/",
        "Disallow: /login",
        "Disallow: /logout",
        "Disallow: /register",
        "",
        `Sitemap: ${sitemapUrl}`,
        "",
    ].join("\n");

    res.type("text/plain").send(body);
};

exports.getSitemap = (req, res) => {
    const tenant = req.app.locals.tenant;
    const base = tenant.siteUrl || "";
    const today = new Date().toISOString().slice(0, 10);

    const urls = [
        { loc: "/", priority: "1.0", changefreq: "daily" },
        { loc: "/corporate", priority: "0.7", changefreq: "monthly" },
        { loc: "/branches", priority: "0.7", changefreq: "monthly" },
        { loc: "/gizlilik", priority: "0.3", changefreq: "yearly" },
        { loc: "/kullanim-kosullari", priority: "0.3", changefreq: "yearly" },
        { loc: "/cerez-politikasi", priority: "0.3", changefreq: "yearly" },
        ...(tenant.popularCities || []).map((route) => ({
            loc: `/rota/${route.slug}`,
            priority: "0.9",
            changefreq: "weekly",
        })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${base}${u.loc === "/" ? "" : u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.type("application/xml").send(xml);
};

exports.getTrips = async (req, res) => {
    const { from, to, date } = req.query;
    const tenant = req.app.locals.tenant;

    setPageSeo(res, {
        title: `Sefer Sonuçları | ${tenant.name}`,
        description: `${tenant.name} sefer arama sonuçları.`,
        robots: "noindex, follow",
        canonical: undefined,
    });

    if (!from || !to || !date) {
        return res.status(400).send("Nereden, nereye ve tarih bilgileri zorunludur.");
    }

    try {
        const [stationsRes, searchRes] = await Promise.all([
            goturApi.getStops(),
            goturApi.searchTrips(from, to, date),
        ]);

        const cities = (stationsRes?.stops || []).map(c => ({
            placeId: c.placeId,
            title: c.title,
        }));

        const rawTrips = searchRes?.trips || [];

        const trips = rawTrips.map(t => {
            const durationStr = t.duration
                ? t.duration.replace("hours", "saat").replace("minutes", "dakika")
                : "Bilinmiyor";

            return {
                id: t.tripId,
                time: t.time,
                duration: durationStr,
                price: t.price,
                fromStr: t.fromStr,
                toStr: t.toStr,
                fromStopId: t.fromStopId,
                toStopId: t.toStopId,
                routeDescription: t.routeDescription,
                routeTimeline: t.routeTimeline,
                busFeatures: t.busFeatures,
                firm: t.firm,
            };
        });

        return res.render("trips", { cities, trips, fromId: from, toId: to, date });
    } catch (err) {
        console.error("🔥 Sefer arama (getTrips) hatası:", err.message);
        return res.render("trips", { cities: [], trips: [], fromId: from, toId: to, date });
    }
};

exports.getJourneySeats = async (req, res) => {
    try {
        const tripId = req.params.id;
        const seatsRes = await goturApi.getJourneySeats(tripId);
        return res.json(seatsRes);
    } catch (err) {
        console.error("❌ Koltuklar çekilirken hata:", err.message);
        return res.status(500).json({ error: "Koltuk verisi alınamadı." });
    }
};

exports.createPayment = async (req, res) => {
    try {
        const { tripId, fromStopId, toStopId, seatNumbers, genders } = req.body;

        const apiRes = await goturApi.createPayment({
            tripId, fromStopId, toStopId, seatNumbers, genders,
        });

        if (apiRes.success && apiRes.paymentId) {
            return res.json({ success: true, paymentId: apiRes.paymentId });
        }

        return res.status(400).json({ error: "Rezervasyon/Ödeme oluşturulamadı." });
    } catch (err) {
        console.error("SITE_PAYMENT_CREATE_ERR:", err.response?.data || err.message);
        return res.status(500).json({ error: "API Hatası: createPayment" });
    }
};

exports.getPaymentPage = async (req, res) => {
    const tenant = req.app.locals.tenant;
    setPageSeo(res, {
        title: `Ödeme | ${tenant.name}`,
        description: "Ödeme sayfası",
        robots: "noindex, nofollow",
        canonical: undefined,
    });

    try {
        const paymentId = req.params.id;
        const apiRes = await goturApi.getPaymentDetail(paymentId);

        if (!apiRes || !apiRes.trip) {
            return res.render("payment", {
                error: "Oturum süreniz doldu veya koltuk seçmediniz. Lütfen tekrar deneyin.",
            });
        }

        if (apiRes.trip.date) {
            try {
                const dateObj = new Date(apiRes.trip.date);
                if (!isNaN(dateObj.getTime())) {
                    apiRes.trip.date = dateObj.toLocaleDateString("tr-TR", {
                        day: "numeric", month: "long", year: "numeric", weekday: "long",
                    });
                }
            } catch (e) {
                console.error("Tarih formatlanırken hata:", e);
            }
        }

        return res.render("payment", {
            paymentId: apiRes.paymentId,
            trip: apiRes.trip,
            seatNumbers: parseJsonArray(apiRes.seatNumbers),
            genders: parseJsonArray(apiRes.genders),
            totalPrice: apiRes.totalPrice,
        });
    } catch (err) {
        console.error("GET_PAYMENT_PAGE_ERR:", err.message);
        return res.render("payment", { error: "Ödeme sayfası yüklenemedi." });
    }
};

exports.paymentComplete = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const formPayload = { ...req.body, asReservation: true };

        if (formPayload.phone) {
            formPayload.phone = formPayload.phone.replace(/\D/g, "");
            if (formPayload.phone.startsWith("0")) {
                formPayload.phone = formPayload.phone.substring(1);
            }
        }

        const apiRes = await goturApi.completePayment(paymentId, formPayload);

        if (apiRes.success) {
            return res.json({
                success: true,
                pnr: apiRes.pnr,
                reservation: true,
                phone: req.app.locals.tenant?.phone || "",
            });
        }

        return res.status(400).json({ error: apiRes.message || "Rezervasyon reddedildi." });
    } catch (err) {
        console.error("PAYMENT_COMPLETE_ERR:", err.message);
        return res.status(500).json({ error: "API Hatası: paymentComplete" });
    }
};

exports.login = async (req, res) => {
    try {
        const { idNumber, password } = req.body;

        if (!idNumber || !password) {
            return res.status(400).json({ error: "Kimlik numarası ve şifre zorunludur." });
        }

        const apiRes = await goturApi.login({ idNumber, password });

        if (apiRes.success && apiRes.user && apiRes.token) {
            setUserCookie(res, apiRes.user, apiRes.token);
            return res.json({ success: true, user: apiRes.user });
        }

        return res.status(401).json({ error: "Giriş başarısız." });
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Giriş sırasında bir hata oluştu.";
        return res.status(status).json({ error: message });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, surname, phone, password, email, gender, idNumber } = req.body;

        if (!name || !surname || !phone || !password || !idNumber) {
            return res.status(400).json({ error: "Lütfen tüm zorunlu alanları doldurun." });
        }

        const apiRes = await goturApi.register({
            name, surname, phone, password, email, gender, idNumber,
        });

        if (apiRes.success && apiRes.user && apiRes.token) {
            setUserCookie(res, apiRes.user, apiRes.token);
            return res.json({ success: true, user: apiRes.user });
        }

        return res.status(400).json({ error: "Kayıt başarısız." });
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Kayıt sırasında bir hata oluştu.";
        return res.status(status).json({ error: message });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("user");
    return res.redirect("/");
};

exports.getProfilePage = async (req, res) => {
    const session = getAuthSession(req);
    if (!session) return res.redirect("/");

    const tenant = req.app.locals.tenant;
    setPageSeo(res, {
        title: `Hesabım | ${tenant.name}`,
        description: "Üye profili",
        robots: "noindex, nofollow",
        canonical: undefined,
    });

    try {
        const apiRes = await goturApi.getProfile(session.id, session.token);
        if (!apiRes.success || !apiRes.user) {
            throw new Error("Profil alınamadı");
        }
        return res.render("profile", { user: apiRes.user });
    } catch (err) {
        console.error("GET_PROFILE_ERR:", err.message);
        res.clearCookie("user");
        return res.redirect("/");
    }
};

exports.updateProfile = async (req, res) => {
    const session = getAuthSession(req);
    if (!session) {
        return res.status(401).json({ error: "Oturum açmanız gerekiyor." });
    }

    try {
        const { name, surname, email, gender, password } = req.body;
        const apiRes = await goturApi.updateProfile(
            { name, surname, email, gender, password },
            session.token
        );

        if (apiRes.success && apiRes.user) {
            setUserCookie(res, apiRes.user, session.token);
            return res.json({ success: true, user: apiRes.user });
        }

        return res.status(400).json({ error: "Güncelleme başarısız." });
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Profil güncellenirken hata oluştu.";
        return res.status(status).json({ error: message });
    }
};

exports.getMyTicketsPage = async (req, res) => {
    const session = getAuthSession(req);
    if (!session) return res.redirect("/");

    const tenant = req.app.locals.tenant;
    setPageSeo(res, {
        title: `Biletlerim | ${tenant.name}`,
        description: "Biletlerim",
        robots: "noindex, nofollow",
        canonical: undefined,
    });

    try {
        const apiRes = await goturApi.getCustomerTickets(session.id, session.token);
        return res.render("my-tickets", {
            tickets: apiRes.tickets || [],
            error: null,
        });
    } catch (err) {
        console.error("GET_MY_TICKETS_ERR:", err.message);
        const message = err.response?.data?.error || "Biletler yüklenemedi.";
        return res.render("my-tickets", { tickets: [], error: message });
    }
};

exports.ticketAction = async (req, res) => {
    const session = getAuthSession(req);
    if (!session) {
        return res.status(401).json({ error: "Oturum açmanız gerekiyor." });
    }

    try {
        const { ticketId, action } = req.body;

        if (!ticketId || !action) {
            return res.status(400).json({ error: "Bilet ID ve işlem türü zorunludur." });
        }

        const apiRes = await goturApi.cancelTicket({ ticketId, action }, session.token);

        if (apiRes.success) {
            return res.json({ success: true, message: apiRes.message });
        }

        return res.status(400).json({ error: "İşlem başarısız." });
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "İşlem sırasında hata oluştu.";
        return res.status(status).json({ error: message });
    }
};
