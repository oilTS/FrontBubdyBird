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
        document.getElementById("submit-upload").disabled = true;
        return;
      }
      selectedFile = file;
      const uploadIconImage = document.querySelector('.upload-icon img');
      uploadIconImage.src = "/assets/file-music.svg";
      uploadText.textContent = `แนบไฟล์: ${file.name}`;
      uploadBox.classList.add("uploaded");
      document.getElementById("submit-upload").disabled = false;
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
          //uploadText.textContent = "อัปโหลดสำเร็จ!";
      })
      .catch(err => {
        alert("เกิดข้อผิดพลาดในการอัปโหลด");
        console.error(err);
        uploadBox.classList.remove("uploaded");
      });
  });

  // MAP
  map = L.map('map').setView([13.9, 100.5], 9);
  markerLayer = L.layerGroup().addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  //marker (pin)
  function customIconAsync(image) {
    return new Promise((resolve) => {
      const path = `/image/${image}`;
      const img = new Image();
      img.onload = () => {
        resolve(L.divIcon({
          html: `<div class="custom-marker-bounce" style="
            width: 40px;
            height: 40px;
            background: url('${path}') no-repeat center;
            background-size: cover;
            border-radius: 50%;
            border: 2.5px solid #fff;
            box-shadow: 0 0 10px #0d8a21; outline: 3px solid #05581f">
            <div style="color: #05581f; margin-top: 32px; margin-left: 10px;
            text-shadow: 0 8px 15px #0d8a21; font-size: 16px;">▼</div>
          </div>`,
          className: "",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -35]
        }));
      };
      img.onerror = () => {
        resolve(L.icon({
          iconUrl: '/assets/pin-2.svg',
          shadowUrl: '/assets/pin-blur.png',
          iconSize: [38, 95],
          iconAnchor: [22, 94],
          shadowSize: [25, 12],
          shadowAnchor: [15, 32],
          popupAnchor: [-3, -60]
        }));
      };
      img.src = path;
    });
  }

  // TABLE
  fetch("data/bird_data.json")
    .then(res => res.json())
    .then(data => {
      const th = document.querySelector("#birdTable th.sortable");
      th.innerHTML = 'ชื่อชนิดนก';
      th.style.cursor = "pointer";
      let ascending = true;

      const sortAndRender = () => {
        const latest5 = data.slice(-5).reverse();
        latest5.sort((a, b) => {
          return ascending
            ? a.species.localeCompare(b.species)
            : b.species.localeCompare(a.species);
        });
        th.innerHTML = (ascending ? '⮃' : '⮃') + ' ชื่อชนิดนก ';
        renderTable(latest5);
      };

      th.addEventListener("click", () => {
        ascending = !ascending;
        sortAndRender();
      });

      const renderTable = async (entries) => {
      const tableBody = document.querySelector("#birdTable tbody");
      tableBody.innerHTML = "";
      markerLayer.clearLayers();

      for (const item of entries) {
        const [lat, lng] = item.location.split(",").map(Number);

        const icon = await customIconAsync(item.image); // async: dynamically load icon with fallback

        const marker = L.marker([lat, lng], {
          icon: icon
        }).bindPopup(`
          <strong style="font-size:15px">${item.species}</strong><br/>
          <img src="image/${item.image}" width="150" style="margin:15px auto 20px auto; display: block; border-radius: 6%;">
        `).addTo(markerLayer);

        const row = document.createElement("tr");
        row.innerHTML = `
          <td><button class="play-btn" data-src="audio/${item.file}" title="play"> 🔊 </button></td>
          <td>${item.species}</td>
          <td>${item.country || 'Thailand'}</td>
          <td><span class="clickable-location" data-lat="${lat}" data-lng="${lng}" title="see on map">
            ${item.location}
          </span></td>
        `;

        // คลิกพิกัด → ไปที่ map
        row.querySelector(".clickable-location").addEventListener("click", () => {
          const offsetLat = lat + 0.004; // shift view slightly south to "lower" the popup in the center
          map.setView([offsetLat, lng], 15);
          marker.openPopup();
        });

        // ปุ่มเล่นเสียง
        const audio = new Audio("audio/" + item.file);
        const playBtn = row.querySelector(".play-btn");
        playBtn.addEventListener("click", () => {
          if (window.currentAudio && window.currentAudio !== audio) {
            window.currentAudio.pause();
            if (window.currentPlayBtn) window.currentPlayBtn.textContent = " 🔊 ";
          }

          if (audio.paused) {
            audio.play();
            playBtn.textContent = "🎵";
            window.currentAudio = audio;
            window.currentPlayBtn = playBtn;
          } else {
            audio.pause();
            playBtn.textContent = "🔈";
            window.currentAudio = null;
            window.currentPlayBtn = null;
          }

          audio.addEventListener("ended", () => {
            playBtn.textContent = "🔊";
            window.currentAudio = null;
            window.currentPlayBtn = null;
          });
        });

        tableBody.appendChild(row);
      }
    };
      sortAndRender();
    })
    .catch(err => console.error("โหลดข้อมูลไม่สำเร็จ:", err));
});

// ปุ่มแสดงผลลัพธ์แบบ mock
document.getElementById("submit-upload")?.addEventListener("click", () => { 
  document.getElementById("result-img").src = "image/sparrow.jpg"; 
  document.getElementById("thai-name").textContent = "House Sparrow"; 
  document.getElementById("common-name").textContent = "Eurasian Tree Sparrow"; 
  document.getElementById("accuracy").textContent = "75.43%"; 
  document.getElementById("result-popup").style.display = "flex";
});

document.getElementById("result-popup")?.addEventListener("click", e => {
  if (e.target.id === "result-popup") {
    e.target.style.display = "none";
  }
});