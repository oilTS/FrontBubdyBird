//nav bar when scrolled
window.addEventListener("scroll", () => {
  const nav = document.querySelector("header");
  if (window.scrollY >= 100) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});
if (window.innerWidth <= 768) {
  const nDrop = document.querySelector('.n-drop');
  nDrop.addEventListener('click', () => {
    document.querySelector('header').classList.toggle('open');
  });
}

let map;
let markerLayer;
let currentData = [];

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#birdTable tbody");
  const headerSpecies = document.querySelector("#birdTable th:nth-child(3)");
  let ascending = true;

  function renderTable(dataArray) {
    tableBody.innerHTML = "";
    markerLayer?.clearLayers();

    dataArray.forEach((item, index) => {
      const [lat, lng] = item.location.split(",").map(Number);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><button class="play-btn" data-src="audio/${item.file}"> 🔊 </button></td>
        <td><button class="image-btn" data-img="image/${item.image}"> 👁 </button></td>
        <td>${item.species}</td>
        <td>${item.length}</td>
        <td>${item.date}</td>
        <td>${item.time}</td>
        <td>${item.country}</td>
        <td><span class="clickable-location" data-index="${index}" data-lat="${lat}" data-lng="${lng}">${item.location}</span></td>
        <td><button class="spectrogram-btn" data-img="${item.spectrogram}"> 📈 </button></td>
        <td>${item.confidence}</td>
      `;
      tableBody.appendChild(row);

      const popupContent = `
        <strong>${item.species}</strong><br/>
        <img src="image/${item.image}" alt="${item.species}" width="100" style="margin-top:5px">
      `;
      L.marker([lat, lng]).bindPopup(popupContent).addTo(markerLayer);
    });

    addEventListeners();
  }
    function addEventListeners() {

    document.querySelectorAll(".play-btn").forEach(btn => {
      const audio = new Audio(btn.getAttribute("data-src"));
      btn.addEventListener("click", () => {
        if (window.currentAudio && window.currentAudio !== audio) {
          window.currentAudio.pause();
          if (window.currentPlayBtn) window.currentPlayBtn.textContent = " 🔊 ";
        }
        if (audio.paused) {
          audio.play();
          btn.textContent = "🎵";
          window.currentAudio = audio;
          window.currentPlayBtn = btn;
        } else {
          audio.pause();
          btn.textContent = "🔈 ";
          window.currentAudio = null;
          window.currentPlayBtn = null;
        }
        audio.addEventListener("ended", () => {
          btn.textContent = "🔊";
          window.currentAudio = null;
          window.currentPlayBtn = null;
        });
      });
    });

    document.querySelectorAll(".image-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const imgSrc = btn.getAttribute("data-img");
        document.getElementById("image-popup-img").src = imgSrc;
        document.getElementById("image-popup").style.display = "flex";
      });
    });

    document.querySelectorAll(".spectrogram-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const imgSrc = btn.getAttribute("data-img");
        document.getElementById("spectrogram-popup-img").src = imgSrc;
        document.getElementById("spectrogram-popup").style.display = "flex";
      });
    });

    const customIcon = (image) => {
      const pinurl = '/assets/pin-h.svg'; // or optionally use the image param
      return L.icon({
        iconUrl: pinurl,
        shadowUrl: '/assets/pin-blur.png',
        iconSize: [38, 95],
        iconAnchor: [22, 94],
        shadowSize: [25, 12],
        shadowAnchor: [15, 32],
        popupAnchor: [-3, -60]
      });
    };

    document.querySelectorAll(".clickable-location").forEach(span => {
      span.addEventListener("click", () => {
        const lat = parseFloat(span.getAttribute("data-lat"));
        const lng = parseFloat(span.getAttribute("data-lng"));
        const index = parseInt(span.getAttribute("data-index"));
        const bird = currentData[index];

        document.getElementById("map-popup").style.display = "flex";

        setTimeout(() => {
          const popupMapContainer = document.getElementById("popup-map");

          // Reset map if already exists
          if (popupMapContainer._leaflet_id) {
            popupMapContainer._leaflet_id = null;
          }

          // Slightly offset latitude to push popup to visual center
          const offsetLat = lat + 0.005;

          const popupMap = L.map("popup-map").setView([offsetLat, lng], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(popupMap);

          const popupContent = `
            <strong>${bird.species}</strong><br>
            <img src="image/${bird.image}" width="100">
          `;

          L.marker([lat, lng], { icon: customIcon(bird.image) }) // ✅ custom icon
            .addTo(popupMap)
            .bindPopup(popupContent)
            .openPopup();
        }, 100);
      });
    });
  }

  function sortAndRender() {
    headerSpecies.innerHTML = (ascending ? '⮃' : '⮃') + ' ชื่อชนิดนก ';
    currentData.sort((a, b) => {
      const nameA = a.species.toLowerCase();
      const nameB = b.species.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    renderTable(currentData);
  }

  headerSpecies.style.cursor = "pointer";
  headerSpecies.addEventListener("click", () => {
    ascending = !ascending;
    sortAndRender();
  });

  fetch("data/bird_data.json")
    .then(res => res.json())
    .then(data => {
      currentData = data;
      initMap();
      sortAndRender();
    })
    .catch(err => console.error("โหลดข้อมูลไม่สำเร็จ", err));
});

function initMap() {
  map = L.map('map').setView([14.02, 100.727], 6);
  markerLayer = L.layerGroup().addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

function closeMapPopup() {
  document.getElementById("map-popup").style.display = "none";
  document.getElementById("popup-map").innerHTML = "";
}
function closeImagePopup() {
  document.getElementById("image-popup").style.display = "none";
}
function closeSpectrogramPopup() {
  document.getElementById("spectrogram-popup").style.display = "none";
}