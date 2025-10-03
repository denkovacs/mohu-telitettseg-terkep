const map = L.map('map').setView([47.1625, 19.5033], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy;'
}).addTo(map);

const infoPlaceholder = document.getElementById('info-placeholder');
const osszTelitettsegSelect = document.getElementById("ossz-telitettseg-filter");

document.getElementById('filter-osszehasonlitas').addEventListener('click', function () {
    this.classList.toggle('active');
    updateFilters();
});

let currentLocation = null;
let activePin = null;

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

const markers = [];         //Összes marker
let locationsData = [];    //Helyszín adatok
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

//Össz. telítettség szűrőhöz
function renderMarkersByOsszTelitettseg(colorFilter, kategoriaFilter = "", cikkszamFilter = "", telitettsegFilter = "") {
    markers.forEach(marker => map.removeLayer(marker));
    markers.length = 0;
    if (activePin) { map.removeLayer(activePin); activePin = null; }

    const groupedData = groupByCoordinates(locationsData);

    Object.entries(groupedData).forEach(([coord, locs]) => {
        // Szűrés minden loc elemre
        const filteredLocs = locs.filter(loc => {
            if (colorFromValue(parsePercent(loc.teljes_kapacitaas)) !== colorFilter) return false;
            if (kategoriaFilter && loc.kategoria !== kategoriaFilter) return false;
            if (cikkszamFilter && loc.cikkszam !== cikkszamFilter) return false;
            if (telitettsegFilter && colorFromValue(parsePercent(loc.tarolt_telitetseg_cikk)) !== telitettsegFilter) return false;
            return true;
        });

        if (!filteredLocs.length) return; // nincs találat, nem rajzolunk

        const parts = coord.split(",").map(s => parseFloat(s.trim()));
        if (parts.some(isNaN)) return;
        const [x, y] = parts;

        const capVal = parsePercent(filteredLocs[0].teljes_kapacitaas); // ikonhoz az első elemet használjuk
        const marker = L.marker([x, y], { icon: icoonByCapacity(capVal) });
        marker.on('click', e => {
            L.DomEvent.stopPropagation(e);
            infoPlaceholder.innerHTML = generateInfoHTML(filteredLocs);
            if (activePin) map.removeLayer(activePin);
            activePin = L.circleMarker([x, y], { radius: 10, color: 'blue', weight: 3, fill: false }).addTo(map);
        });
        marker.addTo(map);
        markers.push(marker);
    });
}
function renderMarkers(kategoriaFilter = "", cikkszamFilter = "", telitettsegFilter = "") {
    markers.forEach(marker => map.removeLayer(marker));
    markers.length = 0;
    if (activePin) { map.removeLayer(activePin); activePin = null; }

    const groupedData = groupByCoordinates(locationsData);
    const isCompareMode = document.getElementById('filter-osszehasonlitas').classList.contains('active');

    Object.entries(groupedData).forEach(([coord, locs]) => {
        // FILTER
        const filteredLocs = locs.filter(loc => {
            if (kategoriaFilter && loc.kategoria !== kategoriaFilter) return false;
            if (cikkszamFilter && loc.cikkszam !== cikkszamFilter) return false;
            if (telitettsegFilter && colorFromValue(parsePercent(loc.tarolt_telitetseg_cikk)) !== telitettsegFilter) return false;
            return true;
        });

        if (!filteredLocs.length) return;

        const parts = coord.split(",").map(s => parseFloat(s.trim()));
        if (parts.some(isNaN)) return;
        const [x, y] = parts;

        if (isCompareMode) {
            const diff = getCapacityDifference(coord);
            let bgColor = diff > 0 ? 'orange' : diff < 0 ? 'green' : 'lightgrey';

            const marker = L.marker([x, y], {
                icon: L.divIcon({
                    className: 'custom-number-marker',
                    html: `<div style="background: ${bgColor}; border-radius:5px;">${diff.toFixed(1)}%</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            });
            marker.on('click', e => {
                L.DomEvent.stopPropagation(e);
                infoPlaceholder.innerHTML = generateInfoHTML(filteredLocs);
                if (activePin) map.removeLayer(activePin);
                activePin = L.circleMarker([x, y], { radius: 10, color: 'blue', weight: 3, fill: false }).addTo(map);
            });
            marker.addTo(map);
            markers.push(marker);

        } else {
            const capVal = parsePercent(filteredLocs[0].teljes_kapacitaas);
            const marker = L.marker([x, y], { icon: icoonByCapacity(capVal) });
            marker.on('click', e => {
                L.DomEvent.stopPropagation(e);
                infoPlaceholder.innerHTML = generateInfoHTML(filteredLocs);
                if (activePin) map.removeLayer(activePin);
                activePin = L.circleMarker([x, y], { radius: 10, color: 'blue', weight: 3, fill: false }).addTo(map);
            });
            marker.addTo(map);
            markers.push(marker);
        }
    });
}

let previousData = [];

Promise.all([
    fetch('./adatok-1.json').then(res => res.json()),
    fetch('./adatok.json').then(res => res.json())
]).then(([current, previous]) => {
    locationsData = current;
    previousData = previous;
    renderMarkers();
});

function getCapacityDifference(coord) {
    const currentLocs = locationsData.filter(l => l.koordinata === coord);
    const previousLocs = previousData.filter(l => l.koordinata === coord);

    if (!currentLocs.length || !previousLocs.length) return 0;

    const currentCap = parsePercent(currentLocs[0].teljes_kapacitaas);
    const previousCap = parsePercent(previousLocs[0].teljes_kapacitaas);

    return ((currentCap - previousCap) / previousCap) * 100;
}

const kategoriaSelect = document.getElementById("kategoria-filter");
const cikkszamSelect = document.getElementById("cikkszam-filter");
const telitettsegSelect = document.getElementById("telitettseg-filter");

function updateFilters() {
    infoPlaceholder.innerHTML = '<p class="info-placeholder-katt">Kattints egy pontra a részletekért.</p>';
    if (activePin) {
        map.removeLayer(activePin);
        activePin = null;
    }
    const selectedKategoria = kategoriaSelect.value;
    const selectedCikkszam = cikkszamSelect.value;
    const selectedTelitettseg = telitettsegSelect.value;
    const selectedOsszTelitettseg = osszTelitettsegSelect.value;

    if (selectedKategoria || selectedCikkszam || selectedTelitettseg) {
        osszTelitettsegSelect.disabled = true;
        osszTelitettsegSelect.value = ""; // visszaáll Összes-re
        renderMarkers(selectedKategoria, selectedCikkszam, selectedTelitettseg);
    } else {
        osszTelitettsegSelect.disabled = false;
        if (selectedOsszTelitettseg) {
            // csak akkor, ha nincs más filter
            renderMarkersByOsszTelitettseg(
                selectedOsszTelitettseg,
                selectedKategoria,
                selectedCikkszam,
                selectedTelitettseg);
        } else {
            renderMarkers();
        }
    }
}

kategoriaSelect.addEventListener("change", updateFilters);
cikkszamSelect.addEventListener("change", updateFilters);
telitettsegSelect.addEventListener("change", updateFilters);
osszTelitettsegSelect.addEventListener("change", updateFilters);


map.on('click', () => {
    infoPlaceholder.innerHTML = '<p class="info-placeholder-katt">Kattints egy pontra a részletekért.</p>'
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
