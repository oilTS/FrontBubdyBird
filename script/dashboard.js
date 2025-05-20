let map;
let markerLayer;

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#birdTable tbody");
  const headerSpecies = document.querySelector("#birdTable th:nth-child(3)"); // ชื่อชนิดนกอยู่ช่องที่ 4
  let ascending = true;
  let currentData = [];

  headerSpecies.innerHTML = "ชื่อชนิดนก ▲";
  headerSpecies.style.cursor = "pointer";
  headerSpecies.addEventListener("click", () => {
    ascending = !ascending;
    sortAndRender();
  });

  function renderTable(dataArray) {
    tableBody.innerHTML = "";
    markerLayer?.clearLayers();

    dataArray.forEach((item, index) => {
      const [lat, lng] = item.location.split(",").map(Number);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><button class="play-btn" data-src="audio/${item.file}">▶</button></td>
        <td><a href="#" class="bird-image-link" data-image="image/${item.image}">${item.image}</a></td>
        <td>${item.species}</td>
        <td>${item.length}</td>
        <td>${item.date}</td>
        <td>${item.time}</td>
        <td>${item.country}</td>
        <td><button class="goto-map" data-lat="${lat}" data-lng="${lng}">${item.location}</button></td>
        <td><a class="link" href="${item.spectrogram}" target="_blank">ดู Spectrogram</a></td>
        <td>${item.confidence}</td>
      `;
      tableBody.appendChild(row);

      const popupContent = `
        <strong>${item.species}</strong><br/>
        <img src="image/${item.image}" alt="${item.species}" width="100" style="margin-top:5px">
      `;
      L.marker([lat, lng]).bindPopup(popupContent).addTo(markerLayer);
    });

    document.querySelectorAll(".play-btn").forEach(btn => {
      const audio = new Audio(btn.getAttribute("data-src"));

      btn.addEventListener("click", () => {
        if (window.currentAudio && window.currentAudio !== audio) {
          window.currentAudio.pause();
          if (window.currentPlayBtn) window.currentPlayBtn.textContent = "▶";
        }

        if (audio.paused) {
          audio.play();
          btn.textContent = "⏸";
          window.currentAudio = audio;
          window.currentPlayBtn = btn;
        } else {
          audio.pause();
          btn.textContent = "▶";
          window.currentAudio = null;
          window.currentPlayBtn = null;
        }

        audio.addEventListener("ended", () => {
          btn.textContent = "▶";
          window.currentAudio = null;
          window.currentPlayBtn = null;
        });
      });
    });

    document.querySelectorAll(".goto-map").forEach(btn => {
      btn.addEventListener("click", () => {
        const lat = parseFloat(btn.getAttribute("data-lat"));
        const lng = parseFloat(btn.getAttribute("data-lng"));
        map.setView([lat, lng], 13);
        L.popup().setLatLng([lat, lng]).setContent("เลื่อนมายังตำแหน่งนี้").openOn(map);
      });
    });

    document.querySelectorAll(".bird-image-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const imageUrl = link.getAttribute("data-image");
        const popup = window.open("", "birdImage", "width=600,height=400");
        popup.document.write(`
          <html>
            <head><title>Bird Image</title></head>
            <body style="margin:0;padding:0;text-align:center;background:#000;">
              <img src="${imageUrl}" style="max-width:100%; max-height:100%;">
            </body>
          </html>
        `);
      });
    });
  }

  function sortAndRender() {
    headerSpecies.innerHTML = 'ชื่อชนิดนก ' + (ascending ? '▲' : '▼');
    currentData.sort((a, b) => {
      const nameA = a.species.toLowerCase();
      const nameB = b.species.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    renderTable(currentData);
  }

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