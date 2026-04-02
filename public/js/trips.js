let ticketPairs = []; // Sepeti tutacağımız dizi (bunu silmişim amk)
let selectedSeat = null;
let selectedTrip = null;

// Senin orijinal efsanevi SVG koltuk motorun
function getSeatSvg(fill, stroke, textStr, textColor) {
    // x ve y merkezlendi, dominant-baseline ile tam ortaya sabitlendi
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
        let skeletonHtml = '<div class="d-flex flex-column-reverse gap-1 placeholder-glow overflow-auto">';
        for (let col = 1; col <= 5; col++) {
            skeletonHtml += '<div class="d-flex flex-row gap-1">';
            for (let row = 1; row <= 8; row++) {
                if (col === 3) {
                    skeletonHtml += '<div style="width:2.75rem; height:3rem;"></div>';
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

            if (json.status === "Success" && json.data && json.data.seats) {
                renderSeatsHorizontal($seatMap, json.data.seats.cells, tripId);
                $trip.data("loaded", true);
            } else {
                $seatMap.html('<div class="text-danger text-center w-100 py-4 fw-bold">Koltuk bilgisi alınamadı.</div>');
            }
        } catch (e) {
            $seatMap.html('<div class="text-danger text-center w-100 py-4 fw-bold">API Bağlantı hatası!</div>');
        }
    }
});

function renderSeatsHorizontal($container, cells, tripId) {
    if (!cells || !cells.length) return;

    $container.empty();
    $container.addClass("d-flex flex-column-reverse gap-1 overflow-auto");

    const maxRow = Math.max(...cells.map(c => c.row));
    const maxCol = Math.max(...cells.map(c => c.col));

    for (let c = 1; c <= maxCol; c++) {
        const $rowDiv = $('<div class="d-flex flex-row gap-1"></div>');

        for (let r = 1; r <= maxRow; r++) {
            const cell = cells.find(x => x.row === r && x.col === c);
            let html = '';

            if (!cell || cell.type === 'None') {
                html = '<div style="width:2.75rem; height:3rem;"></div>';
            } else {
                const seatNo = cell.seat !== 0 ? cell.seat : '';
                let fill, stroke, textC;

                const isAvailable = cell.type && cell.type.startsWith('Available');

                if (isAvailable) {
                    fill = "#FFFFFF"; stroke = "#b4b4b4"; textC = "#000000";
                } else if (cell.type === 'TakenM' || (cell.type.includes('Taken') && cell.gender === true)) {
                    fill = "#D6EAF8"; stroke = "#3498DB"; textC = "#1F618D";
                } else if (cell.type === 'TakenF' || (cell.type.includes('Taken') && cell.gender === false)) {
                    fill = "#F8BBD0"; stroke = "#C2185B"; textC = "#FFFFFF";
                } else if (cell.type === 'Driver') {
                    html = `<div class="d-flex align-items-center justify-content-center" style="width:2.75rem; height:3rem;"><i class="bi bi-steering text-muted fs-3"></i></div>`;
                } else if (cell.type === 'Door') {
                    html = `<div class="d-flex align-items-center justify-content-center" style="width:2.75rem; height:3rem;"><i class="bi bi-door-open text-muted fs-3"></i></div>`;
                } else {
                    fill = "#f8f9fa"; stroke = "#dee2e6"; textC = "#adb5bd";
                }

                if (!html) {
                    html = `
                    <div class="trip_seat" 
                         data-is-available="${isAvailable}" 
                         data-available-type="${cell.type}" 
                         data-seat-number="${cell.seat}" 
                         data-trip="${tripId}"
                         style="cursor:${isAvailable ? 'pointer' : 'not-allowed'}; outline: none;">
                        ${getSeatSvg(fill, stroke, seatNo, textC)}
                    </div>`;
                }
            }
            $rowDiv.append(html);
        }
        $container.append($rowDiv);
    }

    bindSeatClicks();
}

// ==== İŞTE EKSİK OLAN SEPET VE ONAYLAMA MANTIKLARI ====

const highlightSeat = (tripId, seatNumber) => {
    const $el = $(`.trip_seat[data-trip='${tripId}'][data-seat-number='${seatNumber}']`);
    // Koltuğu SVG ile yeşile boyuyoruz
    $el.html(getSeatSvg("#02ff89", "#00c76a", seatNumber, "#005c31"));
};

const upsertTicket = (tripId, seatNumber, gender) => {
    // Aynı koltuk zaten varsa sepetten çıkar (toggle mantığı gibi)
    ticketPairs = ticketPairs.filter(t => !(t.tripId === tripId && t.seatNumber === seatNumber));
    ticketPairs.push({ tripId, seatNumber, gender });
};

const updateTripSeatSummary = (tripId) => {
    const $trip = $(`.trip[data-trip-id='${tripId}']`);
    const $summary = $trip.find(".trip_info-selection");

    if (!$summary.length) return;

    const placeholder = $summary.data("placeholder") || "Koltuk seçiniz.";
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
        totalText = ` - Toplam: ${total.toFixed(2)}₺`;
    }

    $summary.text(`Koltuklar: ${seatText}${totalText}`);
};

function bindSeatClicks() {
    $(".trip_seat").off("click").on("click", function (e) {
        e.stopPropagation();
        const $seat = $(this);

        // jQuery data() önbelleğine güvenmeyip direkt HTML attribute'tan saf string olarak okuyoruz
        const isAvailable = $seat.attr("data-is-available") === "true";
        if (!isAvailable) return;

        const currentSeat = $seat.attr("data-seat-number");
        const currentTrip = $seat.attr("data-trip");

        // 1. İPTAL (DESELECT) KONTROLÜ: Koltuk zaten sepette var mı?
        const isAlreadySelected = ticketPairs.some(t => t.tripId === currentTrip && t.seatNumber === currentSeat);
        
        if (isAlreadySelected) {
            // Sepetten acımadan çıkar
            ticketPairs = ticketPairs.filter(t => !(t.tripId === currentTrip && t.seatNumber === currentSeat));
            
            // Rengini orijinal Boş (Beyaz) haline döndür
            $seat.html(getSeatSvg("#FFFFFF", "#b4b4b4", currentSeat, "#000000")); 
            
            // Alt kısmı (Sepet özeti) güncelle
            updateTripSeatSummary(currentTrip);
            
            // Olası bir durumda açık kalan popup'ı gizle ve değişkenleri sıfırla
            $(".gender-pick").removeClass("show");
            selectedSeat = null;
            selectedTrip = null;
            return;
        }

        // 2. YENİ SEÇİM: Seçili değilse global değişkenleri ata ve popup'ı aç
        selectedSeat = currentSeat;
        selectedTrip = currentTrip;
        
        const availType = $seat.attr("data-available-type");
        const popup = document.querySelector(".gender-pick");
        const $mBtn = $(popup).find('.m');
        const $fBtn = $(popup).find('.f');

        // Cinsiyet Koruması (Flex yapısını bozmadan gizle/göster)
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

        // Popup'ı koltuğun tam üstüne konumlandır
        const rect = this.getBoundingClientRect();
        popup.style.left = rect.left + rect.width / 2 + "px";
        popup.style.top = rect.bottom + window.scrollY + "px";
        popup.style.transform = "translate(-50%, -125%)";
        popup.classList.add("show");
    });
}

// Erkek Seçimi
$(".gender-pick .m").off().on("click", () => {
    if (!selectedSeat || !selectedTrip) return;

    highlightSeat(selectedTrip, selectedSeat);
    upsertTicket(selectedTrip, selectedSeat, "m");
    updateTripSeatSummary(selectedTrip);

    selectedSeat = null;
    selectedTrip = null;
    $(".gender-pick").removeClass("show");
});

// Kadın Seçimi
$(".gender-pick .f").off().on("click", () => {
    if (!selectedSeat || !selectedTrip) return;

    highlightSeat(selectedTrip, selectedSeat);
    upsertTicket(selectedTrip, selectedSeat, "f");
    updateTripSeatSummary(selectedTrip);

    selectedSeat = null;
    selectedTrip = null;
    $(".gender-pick").removeClass("show");
});

// Herhangi bir yere tıklayınca cinsiyet popup'ı kapansın
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
        alert("Sefer bilgileri eksik. Sayfayı yenileyip tekrar dene.");
        return;
    }

    const selected = ticketPairs.filter(t => t.tripId === tripId);

    if (!selected.length) {
        alert("Önce bi koltuk seç, boş otobüsü mü rezerve edeceksin?");
        return;
    }

    const seatNumbers = selected.map(t => t.seatNumber);
    const genders = selected.map(t => t.gender);
    const price = Number($trip.data("price")) || 0;

    // Arayüzden seferin detaylarını çekiyoruz
    const fromStr = $trip.find('.trip-city:first-of-type span').text().trim();
    const toStr = $trip.find('.trip-city:last-of-type span').text().trim();
    const time = $trip.find('.trip-time span').text().trim();
    const date = $("#date").val(); // Arama formundaki tarih inputu

    const payload = {
        tripId,
        fromStopId,
        toStopId,
        seatNumbers,
        genders,
        price,
        fromStr, // Eklendi
        toStr,   // Eklendi
        time,    // Eklendi
        date     // Eklendi
    };

    const $btn = $(this);
    const originalText = $btn.text();
    $btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm"></span> Bekle...');

    try {
        // Backend'e prepareOrder isteğini atıyoruz
        const response = await fetch("/payment/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.paymentId) {
            throw new Error(data.error || "Sepet oluşturulurken bir hata oluştu.");
        }

        // Başarılıysa sepetteki koltukları temizle ve ödemeye geç
        ticketPairs = ticketPairs.filter(t => t.tripId !== tripId);
        window.location.href = `/payment/${data.paymentId}`;

    } catch (err) {
        console.error("Payment create error:", err);
        alert("Hata: " + err.message);
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