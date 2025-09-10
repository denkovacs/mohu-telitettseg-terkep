const map=L.map('map').setView([47.1625,19.5033],7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
attribution: '&copy;'
}).addTo(map);

const infoPlaceholder=document.getElementById('info-placeholder');
let currentLocation=null;

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

function renderMarkers(kategoriaFilter="", cikkszamFilter="",telitettsegFilter=""){
    markers.forEach(marker=>map.removeLayer(marker));
    markers.length=0;
    //markerClusterGroup.clearLayers();
    const groupedData = groupByCoordinates(locationsData);

    Object.entries(groupedData).forEach(([coord, locs]) => {
        let filteredLocs=locs;
        if(kategoriaFilter)filteredLocs=filteredLocs.filter(loc => loc.kategoria === kategoriaFilter);
        if(cikkszamFilter)filteredLocs=filteredLocs.filter(loc => loc.cikkszam === cikkszamFilter);
        if(telitettsegFilter){
            filteredLocs=filteredLocs.filter(loc=>{
                const capacityStr = locs[0].teljes_kapacitaas.replace(",", ".").replace("%", "");
                const capacity = parseFloat(capacityStr);
                let color = "";
                if (capacity >= 0 && capacity < 50) color = "green";
                else if (capacity >= 50 && capacity < 100) color = "yellow";
                else if (capacity >= 100 && capacity < 150) color = "orange";
                else if (capacity >= 150) color = "red";
                return color===telitettsegFilter;
            });
        }

        if(filteredLocs.length===0)return;

        const [x, y] = coord.split(", ").map(c => parseFloat(c.trim()));
        if (isNaN(x) || isNaN(y)) {
            console.warn("Hibás koordináta:", koordinata);
            return;
        }
        
        const capacityStr = locs[0].teljes_kapacitaas.replace(",", ".").replace("%", "");
        const capacity = parseFloat(capacityStr);

        const marker =L.marker([x,y], {icon:icoonByCapacity(capacity)});

        marker.on('click',()=>{
            infoPlaceholder.innerHTML= generateInfoHTML(filteredLocs);
            });
            marker.addTo(map);
            markers.push(marker);  
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
