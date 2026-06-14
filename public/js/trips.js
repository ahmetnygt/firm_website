let ticketPairs = [];
let selectedSeat = null;
let selectedTrip = null;

// Efsanevi SVG koltuk motorun
function getSeatSvg(fill, stroke, textStr, textColor) {
    const textHtml = textStr !== '' ?
        `<text x="50" y="60" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-size="28px" font-weight="bold">${textStr}</text>` : '';

    return `
    <div style="position:relative; width: 2.75rem; height: 2.75rem; max-width: 100px;">
        <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" rx="10" ry="10" fill="${fill}" stroke="${stroke}" stroke-width="2" />
            <rect x="30" y="1" width="50" height="20" rx="5" ry="5" fill="${fill}" stroke="${stroke}" stroke-width="2" />
            <rect x="30" y="75" width="50" height="20" rx="5" ry="5" fill="${fill}" stroke="${stroke}" stroke-width="2" />
            <rect x="75" y="10" width="20" height="80" rx="5" ry="5" fill="${fill}" stroke="${stroke}" stroke-width="2" />
            <rect x="69" y="30" width="30" height="40" rx="5" ry="5" fill="${fill}" stroke="${stroke}" stroke-width="2" />
        </svg>
        ${textHtml}
    </div>`;
}

// Sefer paneline tıklandığında
$(".trip").off().on("click", async function (e) {
    if ($(e.target).closest('.trip_content').length) return;

    const $trip = $(this);
    const tripId = $trip.data("trip-id");
    const $content = $trip.find(".trip_content");
    const $seatMap = $trip.find(`#seat-map-${tripId}`);

    if (this.classList.contains("open")) {
        $content.slideUp(300);
        this.classList.remove("open");
        return;
    }

    this.classList.add("open");
    $content.slideDown(300);

    if (!$trip.data("loaded")) {
        // 🔥 SKELETON LOADING
        let skeletonHtml = '<div class="d-flex flex-row gap-2 placeholder-glow overflow-auto p-3">';
        skeletonHtml += '<div class="d-flex flex-column justify-content-end pb-3 me-3"><div class="placeholder" style="width:2rem; height:2rem; border-radius:50%;"></div></div>';
        for (let col = 1; col <= 10; col++) {
            skeletonHtml += '<div class="d-flex flex-column gap-1">';
            for (let row = 1; row <= 4; row++) {
                if (row === 3) {
                    skeletonHtml += '<div style="width:2.75rem; height:3rem;"></div>'; // Koridor
                } else {
                    skeletonHtml += '<div class="placeholder" style="width:2.75rem; height:3rem; border-radius:10px !important;"></div>';
                }
            }
            skeletonHtml += '</div>';
        }
        skeletonHtml += '</div>';

        $seatMap.html(skeletonHtml);

        try {
            const res = await fetch(`/api/journey-seats/${tripId}`);
            const json = await res.json();

            // YENİ GÖTÜR API ENTEGRASYONU
            if (json.success && json.busPlanBinary) {
                renderGoturSeats($seatMap, json.busPlanBinary, json.tickets || {}, tripId);
                $trip.data("loaded", true);
            } else {
                $seatMap.html('<div class="text-danger text-center w-100 py-4 fw-bold">Koltuk bilgisi alınamadı.</div>');
            }
        } catch (e) {
            $seatMap.html('<div class="text-danger text-center w-100 py-4 fw-bold">API Bağlantı hatası!</div>');
        }
    }
});

// ESKİ OBİLET ÇÖPÜ GİTTİ, YERİNE JİLET GİBİ GÖTÜR RENDER'I GELDİ
function renderGoturSeats($container, planBinary, tickets, tripId) {
    if (!planBinary) return;

    $container.empty();
    $container.addClass("d-flex flex-row gap-2 overflow-auto align-items-center p-3");

    let seatCounter = 1;
    const cols = 4; // 2+1 Otobüs (Koltuk, Koltuk, Koridor, Koltuk)

    const rows = [];
    for (let i = 0; i < planBinary.length; i += cols) {
        rows.push(planBinary.substring(i, i + cols));
    }

    const $driverCol = $('<div class="d-flex flex-column justify-content-end pb-3 me-3" style="min-width:3rem;"><i class="bi bi-steering text-muted fs-2"></i></div>');
    $container.append($driverCol);

    rows.forEach((rowData) => {
        const $colDiv = $('<div class="d-flex flex-column gap-1"></div>');

        for (let s = 0; s < rowData.length; s++) {
            const char = rowData[s];
            let html = '';

            if (char === '0') {
                html = '<div style="width:2.75rem; height:3rem;"></div>';
            } else {
                const currentSeatNo = seatCounter++;
                const ticketInfo = tickets[currentSeatNo.toString()];

                let fill, stroke, textC, isAvailable, availType;

                if (ticketInfo) {
                    isAvailable = false;
                    const g = ticketInfo.gender ? ticketInfo.gender.toUpperCase() : 'M';
                    if (g === 'M' || g === 'ERKEK') {
                        fill = "#D6EAF8"; stroke = "#3498DB"; textC = "#1F618D"; availType = "TakenM";
                    } else {
                        fill = "#F8BBD0"; stroke = "#C2185B"; textC = "#FFFFFF"; availType = "TakenF";
                    }
                } else {
                    isAvailable = true;
                    fill = "#FFFFFF"; stroke = "#b4b4b4"; textC = "#000000";
                    availType = "Available";
                }

                html = `
                <div class="trip_seat" 
                     data-is-available="${isAvailable}" 
                     data-available-type="${availType}" 
                     data-seat-number="${currentSeatNo}" 
                     data-trip="${tripId}"
                     style="cursor:${isAvailable ? 'pointer' : 'not-allowed'}; outline: none;">
                    ${getSeatSvg(fill, stroke, currentSeatNo, textC)}
                </div>`;
            }
            $colDiv.append(html);
        }
        $container.append($colDiv);
    });

    bindSeatClicks();
}

// ==== SEPET VE ONAYLAMA MANTIKLARI ====

const highlightSeat = (tripId, seatNumber) => {
    const $el = $(`.trip_seat[data-trip='${tripId}'][data-seat-number='${seatNumber}']`);
    $el.html(getSeatSvg("#02ff89", "#00c76a", seatNumber, "#005c31"));
};

const upsertTicket = (tripId, seatNumber, gender) => {
    ticketPairs = ticketPairs.filter(t => !(t.tripId === tripId && t.seatNumber === seatNumber));
    ticketPairs.push({ tripId, seatNumber, gender });
};

const updateTripSeatSummary = (tripId) => {
    const $trip = $(`.trip[data-trip-id='${tripId}']`);
    const $summary = $trip.find(".trip_info-selection");

    if (!$summary.length) return;

    const placeholder = $summary.data("placeholder") || "Lütfen yolculuk etmek istediğiniz koltuğu seçiniz.";
    const selected = ticketPairs.filter(t => t.tripId === tripId);

    if (!selected.length) {
        $summary.text(placeholder);
        return;
    }

    const seats = selected.map(t => t.seatNumber).sort((a, b) => Number(a) - Number(b));
    const seatText = seats.join(", ");

    const price = Number($trip.data("price"));
    let totalText = "";

    if (Number.isFinite(price)) {
        const total = price * selected.length;
        totalText = ` - Toplam: ${total.toFixed(2)} ₺`;
    }

    $summary.text(`Seçilen Koltuklar: ${seatText}${totalText}`);
};

function bindSeatClicks() {
    $(".trip_seat").off("click").on("click", function (e) {
        e.stopPropagation();
        const $seat = $(this);

        const isAvailable = $seat.attr("data-is-available") === "true";
        if (!isAvailable) return;

        const currentSeat = $seat.attr("data-seat-number");
        const currentTrip = $seat.attr("data-trip");

        const isAlreadySelected = ticketPairs.some(t => t.tripId === currentTrip && t.seatNumber === currentSeat);

        if (isAlreadySelected) {
            ticketPairs = ticketPairs.filter(t => !(t.tripId === currentTrip && t.seatNumber === currentSeat));
            $seat.html(getSeatSvg("#FFFFFF", "#b4b4b4", currentSeat, "#000000"));
            updateTripSeatSummary(currentTrip);

            $(".gender-pick").removeClass("show");
            selectedSeat = null;
            selectedTrip = null;
            return;
        }

        selectedSeat = currentSeat;
        selectedTrip = currentTrip;

        const availType = $seat.attr("data-available-type");
        const popup = document.querySelector(".gender-pick");
        const $mBtn = $(popup).find('.m');
        const $fBtn = $(popup).find('.f');

        if (availType === 'AvailableM') {
            $mBtn.css('display', 'flex');
            $fBtn.hide();
        } else if (availType === 'AvailableF') {
            $mBtn.hide();
            $fBtn.css('display', 'flex');
        } else {
            $mBtn.css('display', 'flex');
            $fBtn.css('display', 'flex');
        }

        const rect = this.getBoundingClientRect();
        popup.style.left = rect.left + rect.width / 2 + "px";
        popup.style.top = rect.bottom + window.scrollY + "px";
        popup.style.transform = "translate(-50%, -125%)";
        popup.classList.add("show");
    });
}

// Cinsiyet Seçimleri
$(".gender-pick .m").off().on("click", () => {
    if (!selectedSeat || !selectedTrip) return;
    highlightSeat(selectedTrip, selectedSeat);
    upsertTicket(selectedTrip, selectedSeat, "m");
    updateTripSeatSummary(selectedTrip);
    selectedSeat = null;
    selectedTrip = null;
    $(".gender-pick").removeClass("show");
});

$(".gender-pick .f").off().on("click", () => {
    if (!selectedSeat || !selectedTrip) return;
    highlightSeat(selectedTrip, selectedSeat);
    upsertTicket(selectedTrip, selectedSeat, "f");
    updateTripSeatSummary(selectedTrip);
    selectedSeat = null;
    selectedTrip = null;
    $(".gender-pick").removeClass("show");
});

$(document).on("click", function (e) {
    if (!$(e.target).closest('.gender-pick').length && !$(e.target).closest('.trip_seat').length) {
        $(".gender-pick").removeClass("show");
    }
});

// ==== ONAYLA VE ÖDEMEYE GEÇ BÖLÜMÜ ====
$(document).on("click", ".trip_confirm-button", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $trip = $(this).closest(".trip");
    const tripId = String($trip.data("trip-id"));
    const fromStopId = Number($trip.data("from-stop-id"));
    const toStopId = Number($trip.data("to-stop-id"));

    if (!tripId || !fromStopId || !toStopId) {
        alert("Sistemsel bir hata oluştu: Sefer güzergah bilgileri eksik. Lütfen sayfayı yenileyip tekrar deneyiniz.");
        return;
    }

    const selected = ticketPairs.filter(t => t.tripId === tripId);

    if (!selected.length) {
        alert("Lütfen işleme devam etmek için en az bir koltuk seçiniz.");
        return;
    }

    const seatNumbers = selected.map(t => t.seatNumber);
    const genders = selected.map(t => t.gender);
    const price = Number($trip.data("price")) || 0;

    const fromStr = $trip.find('.trip-city:first-of-type span').text().trim();
    const toStr = $trip.find('.trip-city:last-of-type span').text().trim();
    const time = $trip.find('.trip-time span').text().trim();
    const date = $("#date").val();

    const payload = {
        tripId,
        fromStopId,
        toStopId,
        seatNumbers,
        genders,
        price,
        fromStr,
        toStr,
        time,
        date
    };

    const $btn = $(this);
    const originalText = $btn.text();
    $btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm"></span> Yönlendiriliyor...');

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
            throw new Error(data.error || "Rezervasyon oluşturulurken sunucu kaynaklı bir hata oluştu.");
        }

        ticketPairs = ticketPairs.filter(t => t.tripId !== tripId);
        window.location.href = `/payment/${data.paymentId}`;

    } catch (err) {
        console.error("Ödeme oluşturma hatası:", err);
        alert("İşlem başarısız: " + err.message);
        $btn.prop("disabled", false).text(originalText);
    }
});

// Arama formu
document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const date = document.getElementById("date").value;

    if (from === to) return alert("Kalkış ve Varış noktası aynı olamaz!");

    if (from && to && date) {
        window.location.href = `/trips?from=${from}&to=${to}&date=${date}`;
    }
});