const obusApi = require("../utilities/obusApi");

exports.getHomePage = async (req, res) => {
    try {
        // oBus API'den durakları çekiyoruz
        const stationsRes = await obusApi.getStations();
        const rawCities = stationsRes?.data || [];

        // Pug dosyası c.placeId ve c.title bekliyor. 
        // oBus'tan dönen id ve name değerlerini haritalıyoruz.
        const cities = rawCities.map(c => ({
            placeId: c.id,
            title: c.name
        })).sort((a, b) => a.title.localeCompare(b.title));

        // Şimdilik popüler seferler boş kalsın, view patlamasın diye dolduruyoruz
        const popularTrips = [];

        const steps = [
            { icon: "bi-geo-alt", title: "Güzergah Seç" },
            { icon: "bi-calendar-date", title: "Tarih Belirle" },
            { icon: "bi-credit-card", title: "Ödemeyi Yap" },
            { icon: "bi-qr-code", title: "Biletini Al" },
        ];

        const faq = [
            { q: "Nasıl bilet alabilirim?", a: "4 adımda online olarak satın alabilirsiniz." },
            { q: "İptal süreci nasıl?", a: "Sefere 24 saat kalaya kadar kesintisiz iade edebilirsiniz." },
        ];

        return res.render("index", {
            cities,
            destinations: cities.slice(0, 10).map(c => c.title), // İlk 10 şehri popüler gibi gösterelim
            popularTrips,
            steps,
            faq
        });

    } catch (err) {
        console.error("❌ Anasayfa durakları çekilirken sıçtık:", err.message);
        return res.render("index", {
            cities: [],
            destinations: [],
            popularTrips: [],
            steps: [],
            faq: []
        });
    }
};

exports.getTrips = async (req, res) => {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
        return res.status(400).send("Nereden, nereye ve tarih bilgileri zorunlu usta.");
    }

    try {
        const [stationsRes, journeysRes] = await Promise.all([
            obusApi.getStations(),
            obusApi.getJourneys(Number(from), Number(to), date)
        ]);

        const cities = (stationsRes?.data || []).map(c => ({
            placeId: c.id,
            title: c.name
        }));

        // oBus'tan gelen seferleri Pug'ın sevdiği formata haritalıyoruz
        const trips = (journeysRes?.data || []).map(j => {
            const departure = j.route[0];
            const arrival = j.route[j.route.length - 1];

            // Saat ve süre hesabı
            const depDate = new Date(departure.time);
            const arrDate = new Date(arrival.time);
            const durationMs = arrDate - depDate;
            const diffHrs = Math.floor(durationMs / 3600000);
            const diffMins = Math.floor((durationMs % 3600000) / 60000);

            return {
                id: j.id,
                time: depDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                duration: `${diffHrs}s ${diffMins}d`,
                price: j.price.internet,
                fromStr: departure.name,
                toStr: arrival.name,
                fromStopId: departure.id,
                toStopId: arrival.id,
                routeDescription: j.route.map(r => r.name).join(' > '),
                busFeatures: [] // Şimdilik boş, gerekirse j.features'dan ikon maplersin
            };
        });

        console.log(`🚍 oBus'tan ${trips.length} adet sefer bulundu.`);

        return res.render("trips", { cities, trips, fromId: from, toId: to, date });

    } catch (err) {
        console.error("🔥 Sefer arama (getTrips) patladı:", err.message);
        return res.render("trips", { cities: [], trips: [], fromId: from, toId: to, date });
    }
};

exports.getJourneySeats = async (req, res) => {
    try {
        const journeyId = req.params.id;
        const seatsRes = await obusApi.getJourneySeats(journeyId);

        // oBus'tan gelen ham JSON'u bozmadan frontend'e fırlatıyoruz
        return res.json(seatsRes);
    } catch (err) {
        console.error("❌ Koltuklar çekilirken patladık:", err.message);
        return res.status(500).json({ error: "Koltuk verisi alınamadı." });
    }
};

// --- AŞAĞIDAKİ METODLARIN İÇİ ŞİMDİLİK BOŞ, SIRA GELDİKÇE oBUS'A BAĞLAYACAĞIZ ---

exports.createPayment = async (req, res) => {
    res.status(501).json({ error: "Yakında oBus entegrasyonu gelecek." });
};

exports.getPaymentPage = async (req, res) => {
    res.send("Ödeme sayfası yapım aşamasında.");
};

exports.paymentComplete = async (req, res) => {
    res.status(501).json({ error: "Yakında oBus entegrasyonu gelecek." });
};

exports.login = async (req, res) => {
    res.status(501).json({ error: "oBus Müşteri girişi bağlanacak." });
};

exports.register = async (req, res) => {
    res.status(501).json({ error: "oBus Müşteri kaydı bağlanacak." });
};

exports.logout = (req, res) => {
    res.clearCookie('user');
    res.redirect('/');
};

exports.getProfilePage = async (req, res) => {
    res.send("Profil sayfası...");
};

exports.updateProfile = async (req, res) => {
    res.status(501).json({ error: "Profil güncelleme bağlanacak." });
};

exports.getMyTicketsPage = async (req, res) => {
    res.send("Biletlerim...");
};

exports.ticketAction = async (req, res) => {
    res.status(501).json({ error: "Bilet iptal/iade bağlanacak." });
};