const map=L.map('map').setView([47.1625,19.5033],7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
attribution: '&copy;'
}).addTo(map);

const infoPlaceholder=document.getElementById('info-placeholder');
let currentLocation=null;
let activePin=null;

// Ikonok kapacitás alapján
function icoonByCapacity(value) {
    let iconUrl = "./img/green.png";

    if (value >= 0 && value < 50) {
        iconUrl = "./img/green.png";
    } else if (value >= 50 && value < 100) {
        iconUrl = "./img/yellow.png";
    } else if (value >= 100 && value < 150) {
        iconUrl = "./img/orange.png";
    } else if (value >= 150) {
        iconUrl = "./img/red.png";
}
    return new L.Icon({
        iconUrl: iconUrl,
        iconSize: [18.75, 30.75],
        iconAnchor: [9, 30.75],
        popupAnchor: [0.75, -25.5],
        shadowSize: [30.75, 30.75]
    });
}

const markers=[];         //Összes marker
let locationsData=[];    //Helyszín adatok
//csoportosítás
//const markerClusterGroup=L.markerClusterGroup();
//map.addLayer(markerClusterGroup);

function groupByCoordinates(data) {
    const grouped = {};

    data.forEach(loc => {
        const coords = loc.koordinata;
        if (!grouped[coords]) {
            grouped[coords] = [];
        }
        grouped[coords].push(loc);
    });

    return grouped;
}
//Segédfüggvények
function parsePercent(v) {
    if (v === null || v === undefined) return NaN;
    if (typeof v === 'number') return v;
    return parseFloat(String(v).replace(",", ".").replace("%", "").trim());
}
function colorFromValue(val) {
    if (isNaN(val)) return "";
    if (val >= 0 && val < 50) return "green";
    if (val >= 50 && val < 100) return "yellow";
    if (val >= 100 && val < 150) return "orange";
    return "red";
}


function renderMarkers(kategoriaFilter="", cikkszamFilter="", telitettsegFilter=""){
    // előző marker-ek törlése
    markers.forEach(marker => map.removeLayer(marker));
    markers.length = 0;

    // ha új szűrés történt, töröljük a kék kiemelést is (mert már lehet, hogy nem illik az új halmazhoz)
    if (activePin) {
        map.removeLayer(activePin);
        activePin = null;
    }

    const groupedData = groupByCoordinates(locationsData);
    const isFiltering = Boolean(kategoriaFilter || cikkszamFilter || telitettsegFilter);

    Object.entries(groupedData).forEach(([coord, locs]) => {
        let filteredLocs = locs.slice();

        if (kategoriaFilter) filteredLocs = filteredLocs.filter(l => l.kategoria === kategoriaFilter);
        if (cikkszamFilter) filteredLocs = filteredLocs.filter(l => l.cikkszam === cikkszamFilter);

        // ha van telitettsegFilter, akkor azt alkalmazzuk: az érték, amin a szín alapul,
        // a "szűrés módban" tarolt_telitetseg_cikk (ha nincs, fallback teljes_kapacitaas)
        if (telitettsegFilter) {
            filteredLocs = filteredLocs.filter(l => {
                const val = isFiltering
                    ? (isNaN(parsePercent(l.tarolt_telitetseg_cikk)) ? parsePercent(l.teljes_kapacitaas) : parsePercent(l.tarolt_telitetseg_cikk))
                    : parsePercent(l.teljes_kapacitaas);

                return colorFromValue(val) === telitettsegFilter;
            });
        }

        if (filteredLocs.length === 0) return;

        const parts = coord.split(",").map(s => s.trim());
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (isNaN(x) || isNaN(y)) {
            console.warn("Hibás koordináta:", coord);
            return;
        }

        // ikonhoz szükséges érték kiválasztása:
        let iconCapacity = 0;
        if (isFiltering) {
            // szűrésnél: a filteredLocs közül vesszük a tarolt_telitetseg_cikk értékek maximumát (fallback teljes_kapacitaas)
            let maxVal = -Infinity;
            filteredLocs.forEach(l => {
                const tVal = parsePercent(l.tarolt_telitetseg_cikk);
                const fallback = parsePercent(l.teljes_kapacitaas);
                const chosen = isNaN(tVal) ? fallback : tVal;
                if (!isNaN(chosen) && chosen > maxVal) maxVal = chosen;
            });
            if (maxVal === -Infinity) {
                maxVal = parsePercent(locs[0].teljes_kapacitaas) || 0;
            }
            iconCapacity = maxVal;
        } else {
            // alapértelmezett állapot: használjuk a helyszín teljes_kapacitaas értékét
            iconCapacity = parsePercent(locs[0].teljes_kapacitaas) || 0;
        }

        const marker = L.marker([x, y], { icon: icoonByCapacity(iconCapacity) });

        marker.on('click', (e) => {
            
            L.DomEvent.stopPropagation(e);
            infoPlaceholder.innerHTML = generateInfoHTML(filteredLocs);
            if (activePin) {
                map.removeLayer(activePin);
            }
            activePin = L.circleMarker([x, y], {
                radius: 10,
                color: 'blue',
                weight: 3,
                fill: false
            }).addTo(map);
        });

        marker.addTo(map);
        markers.push(marker);
    });
    map.on('click', () => {
    infoPlaceholder.innerHTML = '<p class="info-placeholder-katt">Kattints egy pontra a részletekért.</p>';

    if (activePin) {
        map.removeLayer(activePin);
        activePin = null;
    }
});
}

fetch('./adatok.json')
.then(response=>response.json())
.then(locations=>{
    locationsData=locations;
    renderMarkers();
});

const kategoriaSelect = document.getElementById("kategoria-filter");
const cikkszamSelect = document.getElementById("cikkszam-filter");
const telitettsegSelect = document.getElementById("telitettseg-filter");

function updateFilters() {
    const selectedKategoria = kategoriaSelect.value;
    const selectedCikkszam = cikkszamSelect.value;
    const selectedTelitettseg=telitettsegSelect.value;
    
    renderMarkers(selectedKategoria, selectedCikkszam,selectedTelitettseg);
}

kategoriaSelect.addEventListener("change", updateFilters);
cikkszamSelect.addEventListener("change", updateFilters);
telitettsegSelect.addEventListener("change", updateFilters);

map.on('click',()=>{
infoPlaceholder.innerHTML='<p class="info-placeholder-katt">Kattints egy pontra a részletekért.</p>'
})

function generateInfoHTML(locs) {
const groupedByPartner = {};
    // Csoportosítás partner szerint
    locs.forEach(loc => {
        const partner = loc.partner.trim();
        if (!groupedByPartner[partner]) {
            groupedByPartner[partner] = [];
        }
        groupedByPartner[partner].push(loc);
    });

    let html = '';

    Object.entries(groupedByPartner).forEach(([partner, items]) => {
        const varos = items[0].varos ? ` (${items[0].varos})` : '';
        const telitettseg = items[0].teljes_kapacitaas ? items[0].teljes_kapacitaas : '';
        const keszletdatum = items[0].keszletdatum ? items[0].keszletdatum : '';

        html += `<div class="info-block">
                    <h2><strong>${partner}${varos}<br>Teljes Kihasználtság: ${telitettseg}</strong><br>Készlet dátum: ${keszletdatum}</h2>
                    <table border="1" style="border-collapse: collapse; width: 100%; margin-top: 5px;">
                        <thead>
                            <tr>
                                <th>Cikkszám</th>
                                <th>Megnevezés</th>
                                <th>Kihasználtság</th>
                            </tr>
                        </thead>
                    <tbody>`;

        items.forEach(item => {
            const cikkszamParts = item.cikkszam.split(" - ");
            const cikkszam = cikkszamParts[0] || '';
            const megnevezes = cikkszamParts[1] || '';
            const kihasznaltsag = item.tarolt_telitetseg_cikk || '';

        html += `<tr>
                    <td>${cikkszam}</td>
                    <td>${megnevezes}</td>
                    <td>${kihasznaltsag}</td>
                </tr>`;
        });
        html += `   </tbody>
                    </table>
                 </div><hr>`;
    });
    return html;
}
