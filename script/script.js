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
      })
      .catch(err => {
        alert("เกิดข้อผิดพลาดในการอัปโหลด");
        console.error(err);
      });
  });

  // MAP
  map = L.map('map').setView([13.9, 100.5], 9);
  markerLayer = L.layerGroup().addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const customIcon = (image) => {
    const pinurl = '/assets/pin-2.svg';
    // ถ้าอยากใช้ pin ใน /assets ให้เปลี่ยน L.divIcon เป็น L.icon + ลบส่วน html กับ classname ออก + แก้ไอคอนเซตติ้งตามคอมเม้น
    return L.divIcon({
      html: `<div style="
      width: 40px;
      height: 40px;
      background: url('/image/${image}') no-repeat;
      background-size: cover;
      background-position: right center;
      border-radius: 50%;
      border: 2.5px solid #fff;
      box-shadow: 0px 0px 10px #0d8a21; outline: 3px solid #05581f">
      <div style="color: #05581f;
      margin-top: 30px; margin-left: 10px; 
      text-shadow: -0px 8px 15px #0d8a21; font-size: 16px;">▼</div></div>`,
      className: "",
      iconUrl: pinurl,
      shadowUrl: '/assets/pin-blur.png',
      iconSize: [38, 95],
      iconAnchor: [25, 25],   //22, 94
      shadowSize:   [25, 12],
      shadowAnchor: [15, 32],
      popupAnchor: [-6, -25]  //-3, -60
    });
  }

  // TABLE
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

        entries.forEach((item, index) => {
          const [lat, lng] = item.location.split(",").map(Number);

          const marker = L.marker([lat, lng], {
            icon: customIcon(item.image) // pass the bird image for dynamic icons
          }).bindPopup(`
            <strong style="font-size:15px">${item.species}</strong><br/>
            <img src="image/${item.image}" width="150" style="margin:15px auto 20px auto; display: block; border-radius: 6%;"> 
          `).addTo(markerLayer);

          const row = document.createElement("tr");
          row.innerHTML = `
            <td><button class="play-btn" data-src="audio/${item.file}"> 🔊 </button></td>
            <td>${item.species}</td>
            <td>${item.country || 'Thailand'}</td>
            <td><span class="clickable-location" data-lat="${lat}" data-lng="${lng}" style="color:#2196f3; text-decoration:underline; cursor:pointer;">
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
        });
      };

      sortAndRender();
    })
    .catch(err => console.error("โหลดข้อมูลไม่สำเร็จ:", err));
});

// ปุ่มแสดงผลลัพธ์แบบ mock
document.getElementById("submit-btn")?.addEventListener("click", () => {
  document.getElementById("result-img").src = "image/sparrow.jpg";
  document.getElementById("thai-name").textContent = "นกกระจอกบ้าน";
  document.getElementById("common-name").textContent = "Eurasian Tree Sparrow";
  document.getElementById("accuracy").textContent = "75.43%";
  document.getElementById("result-popup").style.display = "flex";
});

document.getElementById("result-popup")?.addEventListener("click", e => {
  if (e.target.id === "result-popup") {
    e.target.style.display = "none";
  }
});