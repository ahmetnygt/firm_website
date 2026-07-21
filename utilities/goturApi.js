const axios = require('axios');

const API_BASE = process.env.GOTUR_API_URL;
const API_KEY = process.env.GOTUR_API_KEY;
const TENANT_KEY = process.env.GOTUR_TENANT_KEY;
const REQUEST_TIMEOUT_MS = 15000;

const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-tenant-key': TENANT_KEY,
    },
});

function authClient(token) {
    return axios.create({
        baseURL: API_BASE,
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'x-tenant-key': TENANT_KEY,
            Authorization: `Bearer ${token}`,
        },
    });
}

exports.getStops = async () => {
    try {
        const res = await apiClient.get('/stops');
        return res.data;
    } catch (err) {
        const status = err.response?.status;
        const body = err.response?.data;
        const detail = body ? ` ${typeof body === 'string' ? body : JSON.stringify(body)}` : '';
        const wrapped = new Error(`getStops failed (${status || 'no-status'}): ${err.message}.${detail}`);
        wrapped.cause = err;
        throw wrapped;
    }
};

exports.searchTrips = async (from, to, date) => {
    const res = await apiClient.get('/trips/search', { params: { from, to, date } });
    return res.data;
};

exports.getJourneySeats = async (tripId) => {
    const res = await apiClient.get(`/trips/${tripId}/seats`);
    return res.data;
};

exports.createPayment = async (payload) => {
    const res = await apiClient.post('/payment/create', payload);
    return res.data;
};

exports.getPaymentDetail = async (paymentId) => {
    const res = await apiClient.get(`/payment/${paymentId}`);
    return res.data;
};

exports.completePayment = async (paymentId, payload) => {
    const res = await apiClient.post(`/payment/${paymentId}/complete`, payload);
    return res.data;
};

exports.login = async (payload) => {
    const res = await apiClient.post('/auth/login', payload);
    return res.data;
};

exports.register = async (payload) => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
};

exports.getProfile = async (customerId, token) => {
    const res = await authClient(token).get(`/customer/${customerId}`);
    return res.data;
};

exports.updateProfile = async (payload, token) => {
    const res = await authClient(token).post('/customer/update', payload);
    return res.data;
};

exports.getCustomerTickets = async (customerId, token) => {
    const res = await authClient(token).get(`/customer/${customerId}/tickets`);
    return res.data;
};

exports.cancelTicket = async (payload, token) => {
    const res = await authClient(token).post('/ticket/cancel', payload);
    return res.data;
};
