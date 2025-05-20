let map;
let markerLayer;
let selectedFile = null;

document.addEventListener("DOMContentLoaded", function () {
  const uploadBox = document.getElementById("upload-box");
  const uploadText = uploadBox.querySelector("p");
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".wav,.mp3,.aac";
  fileInput.style.display = "none";

  uploadBox.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (file.size > 20 * 1024 * 1024) {
        alert("ไฟล์ใหญ่เกิน 20MB");
        uploadText.textContent = "click to upload file";
        uploadBox.classList.remove("uploaded");
        selectedFile = null;
        return;
      }
      selectedFile = file;
      uploadText.textContent = `แนบไฟล์: ${file.name}`;
      uploadBox.classList.add("uploaded");
    }
  });

  document.body.appendChild(fileInput);

  const submitButton = document.getElementById("submit-upload");
  submitButton.addEventListener("click", () => {
    if (!selectedFile) {
      alert("กรุณาแนบไฟล์ก่อน");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      })
      .then(data => {
        alert("อัปโหลดสำเร็จ!");
        // สามารถ reload หรือทำอย่างอื่นต่อได้ที่นี่
      })
      .catch(err => {
        alert("เกิดข้อผิดพลาดในการอัปโหลด");
        console.error(err);
      });
  });

  map = L.map('map').setView([14.02, 100.727], 6);
  markerLayer = L.layerGroup().addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  fetch("data/bird_data.json")
    .then(res => res.json())
    .then(data => {
      const th = document.querySelector("#birdTable th.sortable");
      th.innerHTML = 'ชื่อชนิดนก ▲';
      th.style.cursor = "pointer";
      let ascending = true;

      const sortAndRender = () => {
        const latest5 = data.slice(-5).reverse();
        latest5.sort((a, b) => {
          return ascending
            ? a.species.localeCompare(b.species)
            : b.species.localeCompare(a.species);
        });
        th.innerHTML = 'ชื่อชนิดนก ' + (ascending ? '▲' : '▼');
        renderTable(latest5);
      };

      th.addEventListener("click", () => {
        ascending = !ascending;
        sortAndRender();
      });

      const renderTable = (entries) => {
        const tableBody = document.querySelector("#birdTable tbody");
        tableBody.innerHTML = "";
        markerLayer.clearLayers();

        entries.forEach(item => {
          const [lat, lng] = item.location.split(",").map(Number);

          const marker = L.marker([lat, lng]).bindPopup(`
            <strong>${item.species}</strong><br/>
            <img src="image/${item.image}" width="100" style="margin-top:5px">
          `).addTo(markerLayer);

          const row = document.createElement("tr");
          row.innerHTML = `
            <td><button class="play-btn" data-src="audio/${item.file}">▶</button></td>
            <td>${item.species}</td>
            <td>${item.country || 'Thailand'}</td>
            <td><button class="goto-map" data-lat="${lat}" data-lng="${lng}">${item.location}</button></td>
          `;

          row.querySelector(".goto-map").addEventListener("click", () => {
            map.setView([lat, lng], 13);
            marker.openPopup();
          });

          const audio = new Audio("audio/" + item.file);
          const playBtn = row.querySelector(".play-btn");
          playBtn.addEventListener("click", () => {
            if (window.currentAudio && window.currentAudio !== audio) {
              window.currentAudio.pause();
              if (window.currentPlayBtn) window.currentPlayBtn.textContent = "▶";
            }

            if (audio.paused) {
              audio.play();
              playBtn.textContent = "⏸";
              window.currentAudio = audio;
              window.currentPlayBtn = playBtn;
            } else {
              audio.pause();
              playBtn.textContent = "▶";
              window.currentAudio = null;
              window.currentPlayBtn = null;
            }

            audio.addEventListener("ended", () => {
              playBtn.textContent = "▶";
              window.currentAudio = null;
              window.currentPlayBtn = null;
            });
          });

          tableBody.appendChild(row);
        });
      };

      sortAndRender();
    })
    .catch(err => console.error("โหลดข้อมูลไม่สำเร็จ:", err));
});