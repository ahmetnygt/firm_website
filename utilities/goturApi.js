const axios = require('axios');

// .env dosyasından senin uzak sunucu (goturyzhn) ayarlarını çekiyoruz
const API_BASE = process.env.GOTUR_API_URL; // Örn: https://api.goturyzhn.com/
const API_KEY = process.env.GOTUR_API_KEY;
const TENANT_KEY = process.env.GOTUR_TENANT_KEY; // Senin apiKeyAuth ve tenantResolver için

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-tenant-key': TENANT_KEY
    }
});

exports.getStops = async () => {
    try {
        const res = await apiClient.get('/stops');
        return res.data;
    } catch (err) {
        console.error("❌ goturApi.getStops patladı:", err.response?.data || err.message);
        throw err;
    }
};

exports.searchTrips = async (from, to, date) => {
    try {
        const res = await apiClient.get('/trips/search', { params: { from, to, date } });
        return res.data;
    } catch (err) {
        console.error("❌ goturApi.searchTrips patladı:", err.response?.data || err.message);
        throw err;
    }
};

exports.getJourneySeats = async (tripId) => {
    try {
        // DİKKAT: Uzak sunucudaki api.js içine bu endpoint'i yazman GEREKİYOR!
        // Frontend'in (trips.js) obilet zamanından kalma { status: "Success", data: { seats: { cells: [...] } } } formatını beklediğini unutma.
        const res = await apiClient.get(`/trips/${tripId}/seats`);
        return res.data;
    } catch (err) {
        console.error("❌ goturApi.getJourneySeats patladı:", err.response?.data || err.message);
        throw err;
    }
};

exports.createPayment = async (payload) => {
    try {
        const res = await apiClient.post('/payment/create', payload);
        return res.data;
    } catch (err) {
        console.error("❌ goturApi.createPayment patladı:", err.response?.data || err.message);
        throw err;
    }
};

exports.getPaymentDetail = async (paymentId) => {
    try {
        const res = await apiClient.get(`/payment/${paymentId}`);
        return res.data;
    } catch (err) {
        console.error("❌ goturApi.getPaymentDetail patladı:", err.response?.data || err.message);
        throw err;
    }
};

exports.completePayment = async (paymentId, payload) => {
    try {
        const res = await apiClient.post(`/payment/${paymentId}/complete`, payload);
        return res.data;
    } catch (err) {
        console.error("❌ goturApi.completePayment patladı:", err.response?.data || err.message);
        throw err;
    }
};