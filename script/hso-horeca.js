const map = L.map('map').setView([47.1625, 19.5033], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy;'
}).addTo(map);

const infoPlaceholder = document.getElementById('info-placeholder');
let currentLocation = null;

// Egyedi ikonok
var mohuIcon = new L.Icon({
    iconUrl: './img/green.png',
    iconSize: [18.75, 30.75],
    iconAnchor: [9, 30.75],
    popupAnchor: [0.75, -25.5],
    shadowSize: [30.75, 30.75]
});

const markers = [];         //Összes marker
let locationsData = [];    //Helyszín adatok

let selectedPartner = "";
let selectedUgyfel = "";

const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);
fetch("https://github.com/denkovacs/mohu-telitettseg-terkep/releases/download/v1.0/hso-horeca.csv")
    .then(response => response.text())
    .then(csvText => {
        const parsed = Papa.parse(csvText, {
            header: true,
            delimiter: ';',
            skipEmptyLines: true
        });
        const rows = parsed.data;
        const grouped = {};

        rows.forEach(row => {
            const key = row.telephely + "_" + row.lat + "_" + row.lon;

            if (!grouped[key]) {
                grouped[key] = {
                    telephely: row.telephely,
                    ugyfel_nev: row.ugyfel_nev,
                    szallito_nev: row.szallito_nev.trim(),
                    lat: parseFloat(row.lat),
                    lon: parseFloat(row.lon),
                    eves_osszesites: {}
                };
            }

            let ev = null;
            if (row.beszallitas_datum && row.beszallitas_datum.trim() !== "") {
                const cleaned = row.beszallitas_datum.replace(/\./g, '-');
                const d = new Date(cleaned);
                ev = d.getFullYear();
            }

            if (!ev || isNaN(ev)) ev = 'Egyéb'; // ha nincs dátum, de mennyiség van → "Egyéb"

            const menny = parseFloat(row.mennyiseg) || 0;
            grouped[key].eves_osszesites[ev] =
                (grouped[key].eves_osszesites[ev] || 0) + menny;

        });
        locationsData = Object.values(grouped);
        renderMarkers();
    });
function renderMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markerClusterGroup.clearLayers();
    markers.length = 0;

    locationsData.forEach(loc => {
        if (selectedPartner && loc.szallito_nev !== selectedPartner) return;
        if (selectedUgyfel && loc.ugyfel_nev !== selectedUgyfel) return;

        const lat = Number(loc.lat);
        const lon = Number(loc.lon);

        if (isNaN(lat) || isNaN(lon)) return;

        const marker = L.marker([lat, lon], { icon: mohuIcon });
        marker.on('click', () => {
            infoPlaceholder.innerHTML = generateInfoHTML(loc);
        });

        markerClusterGroup.addLayer(marker);
        markers.push(marker);
    });
    document.getElementById('marker-counter').innerHTML = `Gyűjtőhelyek száma: ${markers.length.toLocaleString('hu-HU')} db`;
}
function generateInfoHTML(loc) {
    const entries = Object.entries(loc.eves_osszesites);

    let yearlyHTML = "";

    if (entries.length === 0) {
        yearlyHTML = `<li><em>Nincs adat</em></li>`;
    } else {
        yearlyHTML = entries
            .sort((a, b) => {
                if (a[0] === "Egyéb") return 1;
                if (b[0] === "Egyéb") return -1;
                return a[0] - b[0];
            })
            .map(([ev, menny]) => {
                if (menny === 0) return "";
                return `<li>${ev}: <strong>${menny.toFixed(2)} kg</strong></li>`;
            })
            .join("");

        if (yearlyHTML.trim() === "") {
            yearlyHTML = `<li><em>Nincs adat</em></li>`;
        }
    }

    return `
        <h2><strong>${loc.telephely}</strong></h2>
        <p>Ügyfél neve: <strong>${loc.ugyfel_nev}</strong></p>
        <p>Begyűjtést végző partner: <strong>${loc.szallito_nev}</strong></p>
        <p>Koordináta: <strong>${loc.lat.toFixed(6)}, ${loc.lon.toFixed(6)}</strong></p>
        <ul><strong>${yearlyHTML}</strong></ul>
    `;
}

document.getElementById('el-partner-select').addEventListener('change', function () {
    selectedPartner = this.value.trim();
    renderMarkers();
});

document.getElementById('top-filter').addEventListener('change', function () {
    selectedUgyfel = this.value.trim();
    renderMarkers();
});

map.on('click', () => {
    infoPlaceholder.innerHTML = '<p class="info-placeholder-katt">Kattints egy pontra a részletekért.</p>'
})

