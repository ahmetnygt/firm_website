const axios = require('axios');

// .env dosyasından ayarları çekiyoruz
const API_BASE = process.env.OBUS_API_URL;
const BASIC_AUTH = process.env.OBUS_BASIC_AUTH;
const IP_ADDRESS = process.env.OBUS_IP_ADDRESS;
const PORT = process.env.OBUS_PORT;
const PARTNER_CODE = process.env.OBUS_PARTNER_CODE;
const BRANCH_ID = process.env.OBUS_WEB_BRANCH_ID;
const USERNAME = process.env.OBUS_USERNAME;
const PASSWORD = process.env.OBUS_PASSWORD;

// Uygulama ayakta kaldığı sürece session'ı burada tutacağız
let currentSession = {
    sessionId: null,
    deviceId: null,
    token: null
};

// 1. Adım: Session Alma
async function getSession() {
    try {
        const payload = {
            type: 1,
            connection: {
                "ip-address": IP_ADDRESS,
                "port": PORT
            },
            browser: { name: "Chrome" }
        };

        const res = await axios.post(`${API_BASE}client/getsession`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': BASIC_AUTH
            }
        });

        if (res.data && res.data.data) {
            currentSession.sessionId = res.data.data['session-id'];
            currentSession.deviceId = res.data.data['device-id'];
            console.log("✅ oBus Session zımba gibi alındı.");
            return true;
        }
        return false;
    } catch (err) {
        console.error("❌ Session alırken sıçtık:", err.message);
        return false;
    }
}

// 2. Adım: Kullanıcı Girişi (Session'ı yetkilendirme)
async function userLogin() {
    if (!currentSession.sessionId) await getSession();

    try {
        const payload = {
            data: {
                username: USERNAME,
                password: PASSWORD,
                "remember-me": 0,
                "partner-code": PARTNER_CODE,
                //"branch-id": BRANCH_ID
            },
            "device-session": {
                "session-id": currentSession.sessionId,
                "device-id": currentSession.deviceId
            },
            date: new Date().toISOString(),
            language: "tr-TR"
        };

        const res = await axios.post(`${API_BASE}membership/userlogin`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': BASIC_AUTH
            }
        });

        if (res.data && res.data.data && res.data.data.token) {
            currentSession.token = res.data.data.token.data;
            console.log("✅ oBus UserLogin işlemi tamam.");
            return true;
        }
        return false;
    } catch (err) {
        console.error("❌ UserLogin patladı:", err.message);
        return false;
    }
}

// Genel istek atıcı (Bütün oBus servisleri bunu kullanacak)
async function obusRequest(endpoint, data = null) {
    if (!currentSession.token) {
        await userLogin();
    }

    const payload = {
        data: data,
        "device-session": {
            "session-id": currentSession.sessionId,
            "device-id": currentSession.deviceId
        },
        date: new Date().toISOString(),
        language: "tr-TR"
    };

    try {
        const res = await axios.post(`${API_BASE}${endpoint}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': BASIC_AUTH,
                'PartnerCode': PARTNER_CODE
            }
        });
        return res.data;
    } catch (err) {
        console.error(`🔥 ${endpoint} isteği patladı:`, err.response?.data || err.message);
        throw err;
    }
}

// Örnek 1: Durakları Getir
async function getStations() {
    return await obusRequest('web/getstations');
}

// Örnek 2: Seferleri Getir (Bunu da peşin peşin ekliyorum, lazım olacak)
async function getJourneys(originId, destinationId, date) {
    const data = {
        "origin": originId,
        "destination": destinationId,
        "from": `${date}T00:00:00.000Z`,
        "to": `${date}T23:59:59.000Z`
    };
    return await obusRequest('web/getjourneys', data);
}

async function getJourneySeats(journeyId) {
    // API, string formatında journey-id bekliyor
    return await obusRequest('web/getjourneyseats', journeyId);
}

// 1. Aşama: Koltuğu Kilitleme (Sepete Atma)
async function prepareOrder(journeyId, passengersData) {
    const data = {
        "journey-id": journeyId, // Kök dizinde!
        "passengers": passengersData
    };
    return await obusRequest('web/prepareorder', data);
}

// 2. Aşama: Bilet Kesme Yerine Rezervasyon (Ayırtma) Yapma
async function makeReservation(journeyId, orderCode, passengersData) {
    const data = {
        "journey-id": journeyId,
        "order-code": orderCode,
        "passengers": passengersData
    };
    console.log(data)
    return await obusRequest('web/reservation', data);
}

module.exports = {
    getSession,
    userLogin,
    obusRequest,
    getStations,
    getJourneys,
    getJourneySeats,
    prepareOrder,
    makeReservation // Bunları dışarı açıyoruz
};