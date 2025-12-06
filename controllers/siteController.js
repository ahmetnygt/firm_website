require("dotenv").config();
const axios = require("axios");

exports.getHomePage = async (req, res) => {
    try {
        // 1) Stop listesini API'den çek
        const stopRes = await axios.get(
            `${process.env.GOTUR_API_BASE_URL}/stops`,
            {
                headers: {
                    "X-Api-Key": process.env.GOTUR_API_KEY,
                    "X-Tenant-Key": process.env.GOTUR_TENANT_KEY
                }
            }
        );

        const cities = stopRes.data.stops || [];

        // 🔹 Popüler rotalar
        const popularPairs = [
            { fromPlaceId: 17000, toPlaceId: 34520 },
            { fromPlaceId: 17000, toPlaceId: 16000 },
            { fromPlaceId: 34520, toPlaceId: 17000 },
        ];

        const popularTrips = [];

        for (const pair of popularPairs) {
            const from = cities.find(c => c.placeId == pair.fromPlaceId);
            const to = cities.find(c => c.placeId == pair.toPlaceId);

            if (!from || !to) continue;

            // 🔥 fiyatı şimdilik boş geçiyoruz
            popularTrips.push({
                fromStr: from.title,
                toStr: to.title,
                price: null
            });
        }

        // 🔹 Ek sayfa verileri
        const steps = [
            { icon: "bi-geo-alt", title: "Güzergah Seçin" },
            { icon: "bi-calendar-date", title: "Tarih Belirleyin" },
            { icon: "bi-credit-card", title: "Ödeme Yapın" },
            { icon: "bi-qr-code", title: "Biletinizi Alın" },
        ];

        const faq = [
            { q: "Bileti nasıl alabilirim?", a: "4 adımda online olarak satın alabilirsiniz." },
            { q: "İptal süreci nedir?", a: "Kalkışa 24 saat kala ücretsiz iptal." },
            { q: "Yolculuk süresi?", a: "Rota ve trafiğe göre değişir, ortalama 6 saat." },
            { q: "Evcil hayvan kabulü?", a: "Küçük boy köpekler taşıma kabul edilir." },
        ];

        return res.render("index", {
            cities,
            destinations: cities.map(c => c.title),
            popularTrips,
            steps,
            faq
        });

    } catch (err) {
        console.error("❌ Homepage API hatası:", err.response?.data || err.message);

        return res.render("index", {
            cities: [],
            destinations: [],
            popularTrips: []
        });
    }
};

exports.getTrips = async (req, res) => {
    const { from, to, date } = req.query;

    try {
        const stopRes = await axios.get(
            `${process.env.GOTUR_API_BASE_URL}/stops`,
            {
                headers: {
                    "X-Api-Key": process.env.GOTUR_API_KEY,
                    "X-Tenant-Key": process.env.GOTUR_TENANT_KEY
                }
            }
        );

        const cities = stopRes.data.stops || [];

        if (!from || !to || !date) {
            return res.status(400).json({
                error: "from, to ve date zorunludur."
            });
        }

        // 🔥 Götür TRIP SEARCH API
        const apiRes = await axios.get(
            `${process.env.GOTUR_API_BASE_URL}/trips/search`,
            {
                params: { from, to, date },
                headers: {
                    "X-Api-Key": process.env.GOTUR_API_KEY,
                    "X-Tenant-Key": process.env.GOTUR_TENANT_KEY
                }
            }
        );

        const trips = apiRes.data?.trips || [];

        console.log(trips.length + " adet trip bulundu.");

        return res.render("trips", {
            cities,
            trips,
            fromId: from,
            toId: to,
            date
        });

    } catch (err) {
        console.log("🔥 getTrips API hatası:", err.response?.data || err.message);

        return res.render("trips", {
            cities: [],
            trips: [],
            fromId: from,
            toId: to,
            date
        });
    }
};

exports.createPayment = async (req, res) => {
    try {
        const payload = req.body;

        const apiRes = await axios.post(
            `${process.env.GOTUR_API_BASE_URL}/payment/create`,
            payload,
            {
                headers: {
                    "X-Api-Key": process.env.GOTUR_API_KEY,
                    "X-Tenant-Key": process.env.GOTUR_TENANT_KEY
                }
            }
        );

        return res.json(apiRes.data);

    } catch (err) {
        console.error("SITE_PAYMENT_CREATE_ERR:", err.response?.data || err);
        return res.status(500).json({ error: "Payment API hatası" });
    }
};

exports.getPaymentPage = async (req, res) => {
    try {
        const id = req.params.id;

        const apiRes = await axios.get(
            `${process.env.GOTUR_API_BASE_URL}/payment/${id}`,
            {
                headers: {
                    "X-Api-Key": process.env.GOTUR_API_KEY,
                    "X-Tenant-Key": process.env.GOTUR_TENANT_KEY,
                }
            }
        );

        const data = apiRes.data;

        return res.render("payment", {
            paymentId: id,
            trip: data.trip,
            seatNumbers: data.seatNumbers,
            genders: data.genders,
            totalPrice: data.totalPrice,
        });

    } catch (err) {
        return res.render("payment", {
            error: "Ödeme sayfası yüklenemedi.",
        });
    }
};

exports.paymentComplete = async (req, res) => {
    await axios.post(`${process.env.GOTUR_API_BASE_URL}/payment/${req.params.id}/complete`, {},
        { headers: { "X-Api-Key": process.env.GOTUR_API_KEY, "X-Tenant-Key": process.env.GOTUR_TENANT_KEY } });

    res.redirect("/success");
}