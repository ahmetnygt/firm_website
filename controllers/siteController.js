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

// Sepete Ekleme / Koltuk Kilitleme
exports.createPayment = async (req, res) => {
    try {
        const { tripId, seatNumbers, genders, price } = req.body;

        // oBus PrepareOrder'ın beklediği şema
        const passengersData = seatNumbers.map((seat, idx) => ({
            "gender": genders[idx] === 'm', // 'm' ise true (Erkek), 'f' ise false (Kadın)
            "seat-number": Number(seat),
            "price": Number(price) || 0,
            "name": "YOLCU", // Geçici isim
            "surname": "BILGISI", // Geçici soyisim
            "full-name": "YOLCU BILGISI"
        }));

        // journey-id'yi de parametre olarak yolluyoruz
        const apiRes = await obusApi.prepareOrder(tripId, passengersData);

        if (apiRes.success && apiRes.data) {
            // İkinci adımda lazım olacak her boku (özellikle API'nin ürettiği passenger ID'lerini) cookie'ye basıyoruz
            const checkoutData = {
                tripId: tripId,
                orderCode: apiRes.data['pos-order'] ? apiRes.data['pos-order'].code : null, // Örn: 3WH002BXA
                orderId: apiRes.data.id,
                passengersInfo: apiRes.data.passengers, // Bu çok kritik, api'nin verdiği yolcu ID'leri burada
                seatNumbers: seatNumbers,
                genders: genders,
                totalPrice: apiRes.data['total-price'] || (Number(price) * seatNumbers.length)
            };

            res.cookie('checkoutData', JSON.stringify(checkoutData), { maxAge: 15 * 60 * 1000 });
            return res.json({ success: true, paymentId: apiRes.data.id });
        } else {
            return res.status(400).json({ error: apiRes.userMessage || "Koltuklar rezerve edilemedi." });
        }

    } catch (err) {
        console.error("SITE_PAYMENT_CREATE_ERR:", err.response?.data || err.message);
        return res.status(500).json({ error: "API Hatası: PrepareOrder" });
    }
};

// Ödeme (Yolcu Bilgileri) Sayfasını Gösterme
exports.getPaymentPage = async (req, res) => {
    try {
        const id = req.params.id;
        const checkoutDataStr = req.cookies.checkoutData;

        if (!checkoutDataStr) {
            return res.render("payment", { error: "Oturum süreniz doldu veya koltuk seçmediniz. Lütfen tekrar deneyin." });
        }

        const checkoutData = JSON.parse(checkoutDataStr);

        return res.render("payment", {
            paymentId: id,
            // Detaylı sefer verisi elimizde olmadığı için şimdilik statik basıyoruz
            trip: { fromStr: "Seçili Kalkış", toStr: "Seçili Varış", date: "Belirtilen Tarih", time: "Belirtilen Saat" },
            seatNumbers: checkoutData.seatNumbers,
            genders: checkoutData.genders,
            totalPrice: checkoutData.totalPrice,
        });

    } catch (err) {
        return res.render("payment", { error: "Ödeme sayfası yüklenemedi." });
    }
};

// Rezervasyonu Tamamlama
exports.paymentComplete = async (req, res) => {
    try {
        const checkoutDataStr = req.cookies.checkoutData;
        if (!checkoutDataStr) return res.status(400).json({ error: "Sipariş zaman aşımına uğradı. Lütfen baştan başlayın." });

        const checkoutData = JSON.parse(checkoutDataStr);
        const formPayload = req.body;

        // Telefonu temizle (Sadece rakamları al ve başında 0 varsa at)
        let cleanPhone = formPayload.phone ? formPayload.phone.replace(/\D/g, '') : '';
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

        const filledPassengers = checkoutData.passengersInfo.map(p => {
            const seatStr = String(p['seat-number']);

            // Koltuk numaralarını güvenli array'e al (tek koltuk veya çok koltuk ihtimali)
            let seatArray = formPayload.seatNumbers || formPayload['seatNumbers[]'] || [];
            if (!Array.isArray(seatArray)) seatArray = [seatArray];

            const seatIndex = seatArray.indexOf(seatStr);

            if (seatIndex !== -1) {
                // Front-end'den gelen isim, soyisim ve TC'leri güvenli array formatına çevir
                let names = formPayload.names || formPayload.name || formPayload['name[]'] || [];
                let surnames = formPayload.surnames || formPayload.surname || formPayload['surname[]'] || [];
                let ids = formPayload.idNumbers || formPayload.idNumber || formPayload['idNumber[]'] || [];

                if (!Array.isArray(names)) names = [names];
                if (!Array.isArray(surnames)) surnames = [surnames];
                if (!Array.isArray(ids)) ids = [ids];

                p['first-name'] = names[seatIndex] || "YOLCU";
                p['last-name'] = surnames[seatIndex] || "BILGISI";
                p['full-name'] = `${p['first-name']} ${p['last-name']}`;
                p['email'] = formPayload.email || "";
                p['phone'] = cleanPhone;
                p['gov-id'] = ids[seatIndex] || "";
                p['nationality'] = "TR";
                p['passenger-type'] = 1;
                p['pnr-code'] = checkoutData.orderCode;
            }
            return p;
        });

        const apiRes = await obusApi.makeReservation(checkoutData.tripId, checkoutData.orderCode, filledPassengers);

        if (apiRes.success) {
            res.clearCookie('checkoutData');
            return res.json({ success: true, pnr: apiRes.data['order-code'] || checkoutData.orderCode });
        } else {
            return res.status(400).json({ error: apiRes['user-message'] || apiRes.message || "Rezervasyon reddedildi." });
        }

    } catch (err) {
        const obusError = err.response?.data;
        console.error("PAYMENT_COMPLETE_ERR:", JSON.stringify(obusError || err.message, null, 2));
        const detail = obusError?.['user-message'] || obusError?.message || err.message;
        return res.status(500).json({ error: `API Hatası: ${detail}` });
    }
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