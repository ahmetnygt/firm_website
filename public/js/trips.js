/** -------------------------------------------
 *  TRIP CARD AÇ/KAPA + KOLTUK SEÇİMİ BİRLEŞİK KOD
 * ------------------------------------------- */

// Tüm seçilmiş koltukları tutan global array
var ticketPairs = [];
var selectedSeat = null;
var selectedTrip = null;

/* ------------------------------
   TRIP KARTI AÇ / KAPA
-------------------------------*/
$(".trip").off().on("click", function () {
    $(this).find(".trip_content").slideToggle(300);
    this.classList.toggle("open");
});

// İç içerik tıklanınca kartın kapanmasını engelle
$(".trip_content").off().on("click", function (e) {
    e.stopPropagation();
});

/* ------------------------------
   KOLTUK SEÇİMİ + CİNSİYET POPUP
-------------------------------*/
$(".trip_seat").off().on("click", function (e) {
    e.stopPropagation();

    const $seat = $(this);

    if (!$seat.data("is-available")) return;

    selectedSeat = String($seat.data("seat-number"));
    selectedTrip = String($seat.data("trip"));

    const popup = document.querySelector(".gender-pick");
    const rect = this.getBoundingClientRect();

    popup.style.left = rect.left + rect.width / 2 + "px";
    popup.style.top = rect.bottom + window.scrollY + "px";
    popup.style.transform = "translate(-50%, -125%)";
    popup.classList.add("show");
});

/* ------------------------------
   HELPER: Koltuğu yeşil highlight et
-------------------------------*/
const highlightSeat = (tripId, seatNumber) => {
    const $el = $(`.trip_seat[data-trip='${tripId}'][data-seat-number='${seatNumber}']`);

    $el.find("rect").attr({
        fill: "#02ff89",
        stroke: "#00c76a",
    });

    $el.find("span").css("color", "#008346");
};

/* ------------------------------
   HELPER: ticketPairs içine ekle/güncelle
-------------------------------*/
const upsertTicket = (tripId, seatNumber, gender) => {
    ticketPairs = ticketPairs.filter(
        t => !(t.tripId === tripId && t.seatNumber === seatNumber)
    );

    ticketPairs.push({ tripId, seatNumber, gender });
};

/* ------------------------------
   HELPER: Trip kartındaki seçim özetini güncelle
-------------------------------*/
const updateTripSeatSummary = (tripId) => {
    const $trip = $(`.trip[data-trip-id='${tripId}']`);
    const $summary = $trip.find(".trip_info-selection");

    if (!$summary.length) return;

    const placeholder = $summary.data("placeholder") || "";
    const selected = ticketPairs.filter(t => t.tripId === tripId);

    if (!selected.length) {
        $summary.text(placeholder);
        return;
    }

    const seats = selected
        .map(t => t.seatNumber)
        .sort((a, b) => Number(a) - Number(b));

    const seatText = seats.join(", ");

    const price = Number($trip.data("price"));
    let totalText = "";

    if (Number.isFinite(price)) {
        const total = price * selected.length;
        totalText = ` - Toplam: ${total.toFixed(2)}₺`;
    }

    $summary.text(`Koltuklar: ${seatText}${totalText}`);
};

/* ------------------------------
   POPUP → ERKEK SEÇİMİ
-------------------------------*/
$(".gender-pick .m").off().on("click", () => {
    if (!selectedSeat || !selectedTrip) return;

    highlightSeat(selectedTrip, selectedSeat);
    upsertTicket(selectedTrip, selectedSeat, "m");
    updateTripSeatSummary(selectedTrip);

    selectedSeat = null;
    selectedTrip = null;
    $(".gender-pick").removeClass("show");
});

/* ------------------------------
   POPUP → KADIN SEÇİMİ
-------------------------------*/
$(".gender-pick .f").off().on("click", () => {
    if (!selectedSeat || !selectedTrip) return;

    highlightSeat(selectedTrip, selectedSeat);
    upsertTicket(selectedTrip, selectedSeat, "f");
    updateTripSeatSummary(selectedTrip);

    selectedSeat = null;
    selectedTrip = null;
    $(".gender-pick").removeClass("show");
});

/* ------------------------------
   ÖDEME OLUŞTURMA → PAYMENT PAGE'E GİT
-------------------------------*/
$(".trip_confirm-button").off().on("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const $trip = $(e.currentTarget).closest(".trip");

    const tripId = String($trip.data("tripId"));
    const fromStopId = Number($trip.data("fromStopId"));
    const toStopId = Number($trip.data("toStopId"));

    if (!tripId || !fromStopId || !toStopId) {
        alert("Sefer bilgileri eksik. Lütfen tekrar deneyin.");
        return;
    }

    // Bu trip için seçilmiş koltukları çek
    const selected = ticketPairs.filter(t => t.tripId === tripId);

    if (!selected.length) {
        alert("Lütfen en az bir koltuk seçin.");
        return;
    }

    const seatNumbers = selected.map(t => t.seatNumber);
    const genders = selected.map(t => t.gender);

    const payload = {
        tripId,
        fromStopId,
        toStopId,
        seatNumbers,
        genders
    };

    try {
        const response = await fetch("/payment/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.paymentId) {
            throw new Error(data.error || "Ödeme isteği oluşturulamadı.");
        }

        // Seçimleri temizle
        ticketPairs = ticketPairs.filter(t => t.tripId !== tripId);

        // Payment sayfasına yönlendir
        window.location.href = `/payment/${data.paymentId}`;

    } catch (err) {
        console.error("Payment create error:", err);
        alert("Ödeme isteği sırasında bir hata oluştu.");
    }
});

document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const date = document.getElementById("date").value;

    if (from === to) return alert("Kalkış ve Varış aynı olamaz!");

    if (from && to && date) {
        window.location.href = `/trips?from=${from}&to=${to}&date=${date}`;
    }
});
