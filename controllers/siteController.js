const goturApi = require("../utilities/goturApi");

exports.getHomePage = async (req, res) => {
    try {
        // Götür API'den durakları çekiyoruz
        const apiRes = await goturApi.getStops();
        const rawCities = apiRes?.stops || [];

        const cities = rawCities.map(c => ({
            placeId: c.placeId,
            title: c.title
        })).sort((a, b) => a.title.localeCompare(b.title));

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
            destinations: cities.slice(0, 10).map(c => c.title),
            popularTrips,
            steps,
            faq
        });

    } catch (err) {
        console.error("❌ Anasayfa durakları çekilirken sıçtık:", err.message);
        return res.render("index", {
            cities: [], destinations: [], popularTrips: [], steps: [], faq: []
        });
    }
};

exports.getTrips = async (req, res) => {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
        return res.status(400).send("Nereden, nereye ve tarih bilgileri zorunlu usta.");
    }

    try {
        const [stationsRes, searchRes] = await Promise.all([
            goturApi.getStops(),
            goturApi.searchTrips(from, to, date)
        ]);

        const cities = (stationsRes?.stops || []).map(c => ({
            placeId: c.placeId,
            title: c.title
        }));

        const rawTrips = searchRes?.trips || [];

        // Backend'in zaten jilet gibi dönüyor veriyi, İngilizce gelen duration'ı Türkçeleştirip Pug'a yediriyoruz.
        const trips = rawTrips.map(t => {
            let durationStr = t.duration ? t.duration.replace("hours", "saat").replace("minutes", "dakika") : "Bilinmiyor";

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
                firm: t.firm
            };
        });

        console.log(`🚍 Götür Sisteminden ${trips.length} adet sefer bulundu.`);
        return res.render("trips", { cities, trips, fromId: from, toId: to, date });

    } catch (err) {
        console.error("🔥 Sefer arama (getTrips) patladı:", err.message);
        return res.render("trips", { cities: [], trips: [], fromId: from, toId: to, date });
    }
};

exports.getJourneySeats = async (req, res) => {
    try {
        const tripId = req.params.id;
        const seatsRes = await goturApi.getJourneySeats(tripId);

        // Frontend (trips.js) obilet formatına alışkın. API'den o formatta döndüğünü varsayıyoruz.
        return res.json(seatsRes);
    } catch (err) {
        console.error("❌ Koltuklar çekilirken patladık:", err.message);
        return res.status(500).json({ error: "Koltuk verisi alınamadı." });
    }
};

exports.createPayment = async (req, res) => {
    try {
        const { tripId, fromStopId, toStopId, seatNumbers, genders } = req.body;

        // Obilet'in rezil payload'unu çöpe attık, direkt Götür API yapısı
        const apiRes = await goturApi.createPayment({
            tripId, fromStopId, toStopId, seatNumbers, genders
        });

        if (apiRes.success && apiRes.paymentId) {
            // Artık cookie ameleliğine gerek yok, direkt veritabanındaki paymentId'den yürüyoruz.
            return res.json({ success: true, paymentId: apiRes.paymentId });
        } else {
            return res.status(400).json({ error: "Rezervasyon/Ödeme oluşturulamadı." });
        }

    } catch (err) {
        console.error("SITE_PAYMENT_CREATE_ERR:", err.response?.data || err.message);
        return res.status(500).json({ error: "API Hatası: createPayment" });
    }
};

exports.getPaymentPage = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const apiRes = await goturApi.getPaymentDetail(paymentId);

        if (!apiRes || !apiRes.trip) {
            return res.render("payment", { error: "Oturum süreniz doldu veya koltuk seçmediniz. Lütfen tekrar deneyin." });
        }

        // Tarihi insancıl formata çevirme operasyonu
        if (apiRes.trip.date) {
            try {
                const dateObj = new Date(apiRes.trip.date);
                if (!isNaN(dateObj.getTime())) {
                    apiRes.trip.date = dateObj.toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
                    });
                }
            } catch (e) {
                console.error("Tarih formatlanırken ufak bir pürüz:", e);
            }
        }

        return res.render("payment", {
            paymentId: apiRes.paymentId,
            trip: apiRes.trip,
            seatNumbers: apiRes.seatNumbers,
            genders: apiRes.genders,
            totalPrice: apiRes.totalPrice,
        });

    } catch (err) {
        return res.render("payment", { error: "Ödeme sayfası yüklenemedi." });
    }
};

exports.paymentComplete = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const formPayload = req.body;

        // Telefon numarasını temizleyelim
        if (formPayload.phone) {
            formPayload.phone = formPayload.phone.replace(/\D/g, '');
            if (formPayload.phone.startsWith('0')) formPayload.phone = formPayload.phone.substring(1);
        }

        const apiRes = await goturApi.completePayment(paymentId, formPayload);

        if (apiRes.success) {
            return res.json({ success: true, pnr: apiRes.ticketGroupId });
        } else {
            return res.status(400).json({ error: apiRes.message || "Rezervasyon reddedildi." });
        }

    } catch (err) {
        console.error("PAYMENT_COMPLETE_ERR:", err.message);
        return res.status(500).json({ error: "API Hatası: paymentComplete" });
    }
};

// --- DİĞER STATİK METOTLAR AYNI KALIYOR ---
exports.getBranchesPage = (req, res) => { /*... aynı ...*/ };
exports.login = async (req, res) => { res.status(501).json({ error: "ÇOK YAKINDA EKLENECEK" }); };
exports.register = async (req, res) => { res.status(501).json({ error: "ÇOK YAKINDA EKLENECEK" }); };
exports.logout = (req, res) => { res.clearCookie('user'); res.redirect('/'); };
exports.getProfilePage = async (req, res) => { res.send("Profil sayfası..."); };
exports.updateProfile = async (req, res) => { res.status(501).json({ error: "ÇOK YAKINDA EKLENECEK" }); };
exports.getMyTicketsPage = async (req, res) => { res.send("ÇOK YAKINDA EKLENECEK"); };
exports.ticketAction = async (req, res) => { res.status(501).json({ error: "ÇOK YAKINDA EKLENECEK" }); };