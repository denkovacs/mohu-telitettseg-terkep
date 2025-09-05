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

const markerClusterGroup=L.markerClusterGroup();
map.addLayer(markerClusterGroup);

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

function renderMarkers(typeFilter){
    markers.forEach(marker=>map.removeLayer(marker));
    markers.length=0;
    markerClusterGroup.clearLayers();

    const groupedData = groupByCoordinates(locationsData);

    Object.entries(groupedData).forEach(([coord, locs]) => {
        
         if (typeFilter && !locs.some(loc => loc.kategoria === typeFilter)) {
            return;
        }
        const [x, y] = coord.split(", ").map(c => parseFloat(c.trim()));
        if (isNaN(x) || isNaN(y)) {
            console.warn("Hibás koordináta:", koordinata);
            return;
        }
        const capacityStr = locs[0].teljes_kapacitaas.replace(",", ".").replace("%", "");
        const capacity = parseFloat(capacityStr);

        const marker =L.marker([x,y], {icon:icoonByCapacity(capacity)});

        marker.bindTooltip(`Kihasználtság: ${locs[0].teljes_kapacitaas}`, {
            permanent: false,
            direction: "bottom"
        });

        marker.on('click',()=>{
            infoPlaceholder.innerHTML= generateInfoHTML(locs);
            });
            markerClusterGroup.addLayer(marker);
            markers.push(marker);  
    });
}

fetch('./adatok.json')
.then(response=>response.json())
.then(locations=>{
    locationsData=locations;
    renderMarkers();
});

document.getElementById("kategoria-filter").addEventListener("change", function () {
    const selected = this.value;
    renderMarkers(selected);
});

map.on('click',()=>{
infoPlaceholder.innerHTML='<p class="info-placeholder-katt">Kattints egy pontra a részletekért.</p>'
})
function generateInfoHTML(locs) {
    const groupedByPartner = {};
    
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
        html += `<div class="info-block">
                    <h2><strong>${partner}${varos}| Kihasználtság: ${telitettseg}</strong></h2>`;
        items.forEach(item => {
            html += `<p>Cikkszám: <strong>${item.cikkszam}</strong> | Készlet dátum: <strong>${item.keszletdatum}</strong></p>`;
        });
        html += `</div><hr>`;
    });

    return html;
}
