require("dotenv").config();
const axios = require("axios");

exports.getHomePage = async (req, res) => {
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

            popularTrips.push({
                fromStr: from.title,
                toStr: to.title,
                price: null
            });
        }

        const steps = [
            { icon: "bi-geo-alt", title: "Select Route" },
            { icon: "bi-calendar-date", title: "Specify Date" },
            { icon: "bi-credit-card", title: "Make Payment" },
            { icon: "bi-qr-code", title: "Get Your Ticket" },
        ];

        const faq = [
            { q: "How can I buy a ticket?", a: "You can purchase online in 4 steps." },
            { q: "What is the cancellation process?", a: "Free cancellation up to 24 hours before departure." },
            { q: "What is the travel duration?", a: "Varies depending on route and traffic, approximately 6 hours." },
            { q: "Are pets allowed?", a: "Small dogs are accepted for transport." },
        ];

        return res.render("index", {
            cities,
            destinations: cities.map(c => c.title),
            popularTrips,
            steps,
            faq
        });

    } catch (err) {
        console.error("❌ Homepage API Error:", err.response?.data || err.message);

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
                error: "from, to, and date are required."
            });
        }

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

        console.log(trips.length + " trips found.");

        return res.render("trips", {
            cities,
            trips,
            fromId: from,
            toId: to,
            date
        });

    } catch (err) {
        console.log("🔥 getTrips API error:", err.response?.data || err.message);

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
        return res.status(500).json({ error: "Payment API error" });
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
            error: "Payment page could not be loaded.",
        });
    }
};

exports.paymentComplete = async (req, res) => {
    try {
        const apiRes = await axios.post(
            `${process.env.GOTUR_API_BASE_URL}/payment/${req.params.id}/complete`,
            req.body,
            {
                headers: {
                    "X-Api-Key": process.env.GOTUR_API_KEY,
                    "X-Tenant-Key": process.env.GOTUR_TENANT_KEY
                }
            }
        );

        return res.json(apiRes.data);

    } catch (err) {
        console.error("PAYMENT_COMPLETE_ERR:", err.response?.data || err.message);
        return res.status(500).json({ error: "Payment could not be completed." });
    }
};

exports.login = async (req, res) => {
    try {
        const apiRes = await axios.post(`${process.env.GOTUR_API_BASE_URL}/auth/login`, req.body, {
            headers: { "X-Api-Key": process.env.GOTUR_API_KEY, "X-Tenant-Key": process.env.GOTUR_TENANT_KEY }
        });

        if (apiRes.data.success) {
            res.cookie('user', JSON.stringify(apiRes.data.user), { maxAge: 30 * 24 * 60 * 60 * 1000 });
        }

        res.json(apiRes.data);
    } catch (e) {
        res.status(e.response?.status || 500).json(e.response?.data || { error: "Login failed" });
    }
};

exports.register = async (req, res) => {
    try {
        const apiRes = await axios.post(`${process.env.GOTUR_API_BASE_URL}/auth/register`, req.body, {
            headers: { "X-Api-Key": process.env.GOTUR_API_KEY, "X-Tenant-Key": process.env.GOTUR_TENANT_KEY }
        });

        if (apiRes.data.success) {
            res.cookie('user', JSON.stringify(apiRes.data.user), { maxAge: 30 * 24 * 60 * 60 * 1000 });
        }

        res.json(apiRes.data);
    } catch (e) {
        res.status(e.response?.status || 500).json(e.response?.data || { error: "Register failed" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('user');
    res.redirect('/');
};

exports.getProfilePage = async (req, res) => {
    const localUser = res.locals.user;
    if (!localUser) return res.redirect("/");

    try {
        const apiRes = await axios.get(`${process.env.GOTUR_API_BASE_URL}/customer/${localUser.id}`, {
            headers: { "X-Api-Key": process.env.GOTUR_API_KEY, "X-Tenant-Key": process.env.GOTUR_TENANT_KEY }
        });

        const freshUser = apiRes.data.user;

        res.render("profile", { user: freshUser });

    } catch (err) {
        console.error("PROFILE_PAGE_ERR:", err.message);
        res.render("profile", { user: localUser, error: "Could not fetch updated information." });
    }
};

exports.updateProfile = async (req, res) => {
    const localUser = res.locals.user;
    if (!localUser) return res.status(401).json({ error: "Session closed." });

    try {
        const payload = { ...req.body, id: localUser.id };

        const apiRes = await axios.post(`${process.env.GOTUR_API_BASE_URL}/customer/update`, payload, {
            headers: { "X-Api-Key": process.env.GOTUR_API_KEY, "X-Tenant-Key": process.env.GOTUR_TENANT_KEY }
        });

        if (apiRes.data.success) {
            res.cookie('user', JSON.stringify(apiRes.data.user), { maxAge: 30 * 24 * 60 * 60 * 1000 });
        }

        res.json(apiRes.data);

    } catch (e) {
        res.status(e.response?.status || 500).json(e.response?.data || { error: "Update failed" });
    }
};

exports.getMyTicketsPage = async (req, res) => {
    const localUser = res.locals.user;
    if (!localUser) return res.redirect("/");

    try {
        const apiRes = await axios.get(`${process.env.GOTUR_API_BASE_URL}/customer/${localUser.idNumber}/tickets`, {
            headers: { "X-Api-Key": process.env.GOTUR_API_KEY, "X-Tenant-Key": process.env.GOTUR_TENANT_KEY }
        });

        const tickets = apiRes.data.tickets || [];

        res.render("my-tickets", { user: localUser, tickets });

    } catch (err) {
        console.error("MY_TICKETS_ERR:", err.message);
        res.render("my-tickets", { user: localUser, tickets: [], error: "Tickets could not be loaded." });
    }
};

exports.ticketAction = async (req, res) => {
    const localUser = res.locals.user;
    if (!localUser) return res.status(401).json({ error: "Session closed." });

    try {
        const apiRes = await axios.post(`${process.env.GOTUR_API_BASE_URL}/ticket/cancel`, req.body, {
            headers: { "X-Api-Key": process.env.GOTUR_API_KEY, "X-Tenant-Key": process.env.GOTUR_TENANT_KEY }
        });
        res.json(apiRes.data);
    } catch (e) {
        res.status(500).json(e.response?.data || { error: "Operation failed." });
    }
};