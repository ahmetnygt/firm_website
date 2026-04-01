/* public/js/trips.js - Yatay Düzene (Horizontal) Oturtulmuş Son Hali */

let selectedSeat = null;
let selectedTrip = null;

// Senin orijinal efsanevi SVG koltuk motorun
function getSeatSvg(fill, stroke, textStr, textColor) {
    const textHtml = textStr !== '' ? 
        `<span style="position:absolute;top:50%;left:45%;transform:translate(-50%, -50%);color:${textColor}; font-weight:bold; font-size: 1rem;">${textStr}</span>` : '';

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
        // 🔥 SKELETON LOADING (Yatay Otobüs Mantığına Göre)
        // Dış container flex-column (Y ekseni: Cam kenarı, koridor vs.)
        let skeletonHtml = '<div class="d-flex flex-column-reverse gap-1 placeholder-glow overflow-auto pb-2 px-2">';
        
        for(let col = 1; col <= 5; col++) { 
            // İçerisi flex-row (X ekseni: Önden arkaya koltuklar)
            skeletonHtml += '<div class="d-flex flex-row gap-1">';
            for(let row = 1; row <= 8; row++) { 
                if (col === 3) { // 3. sütunu koridor yapalım
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

// oBus'tan gelen matrisi col ve row'u ters çevirerek (Yatay) çiziyoruz
function renderSeatsHorizontal($container, cells, tripId) {
    if (!cells || !cells.length) return;
    
    $container.empty();
    
    // Dış kapsayıcı dikey dizilecek (Cam, Aisle, Cam)
    $container.addClass("d-flex flex-column-reverse gap-1 overflow-auto pb-2 px-2"); 
    
    const maxRow = Math.max(...cells.map(c => c.row));
    const maxCol = Math.max(...cells.map(c => c.col));

    // DIŞ DÖNGÜ: Otobüsün eni (col) -> Yukarıdan aşağıya
    for (let c = 1; c <= maxCol; c++) {
        // İÇ DÖNGÜ: Otobüsün boyu (row) -> Soldan sağa
        const $rowDiv = $('<div class="d-flex flex-row gap-1"></div>');
        
        for (let r = 1; r <= maxRow; r++) {
            const cell = cells.find(x => x.row === r && x.col === c);
            let html = '';
            
            if (!cell || cell.type === 'None') {
                html = '<div style="width:2.75rem; height:3rem;"></div>';
            } else {
                const seatNo = cell.seat !== 0 ? cell.seat : '';
                let fill, stroke, textC;

                if (cell.type === 'Available') {
                    fill = "#FFFFFF"; stroke = "#666666"; textC = "#000000";
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
                         data-is-available="${cell.type === 'Available'}" 
                         data-seat-number="${cell.seat}" 
                         data-trip="${tripId}"
                         style="cursor:${cell.type === 'Available' ? 'pointer' : 'not-allowed'}; outline: none;">
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

function bindSeatClicks() {
    $(".trip_seat").off().on("click", function (e) {
        e.stopPropagation();
        const $seat = $(this);
        
        if ($seat.data("is-available") !== true) return;

        selectedSeat = String($seat.data("seat-number"));
        selectedTrip = String($seat.data("trip"));

        const popup = document.querySelector(".gender-pick");
        const rect = this.getBoundingClientRect();

        popup.style.left = rect.left + rect.width / 2 + "px";
        popup.style.top = rect.bottom + window.scrollY + "px";
        popup.style.transform = "translate(-50%, -125%)";
        popup.classList.add("show");
    });
}