const goturApi = require("../utilities/goturApi");

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

exports.getHomePage = async (req, res) => {
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

exports.getTrips = async (req, res) => {
    const { from, to, date } = req.query;

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

exports.getBranchesPage = (req, res) => {
    return res.render("branches", {
        branches: req.app.locals.tenant.branches || [],
    });
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
