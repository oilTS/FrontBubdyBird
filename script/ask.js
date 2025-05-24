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

let currentIndex = 0;
let birdData = [];
let currentAudio = null;
let lastLatLon = null;

function loadBird(index) {
  const bird = birdData[index];

  document.getElementById("bird-image").src = "image/" + bird.image;
  document.getElementById("bird-species").textContent = bird.species;
  document.getElementById("bird-country").textContent = bird.country;
  document.getElementById("bird-date").textContent = bird.date;
  document.getElementById("bird-time").textContent = bird.time;
  document.getElementById("spectrogram-img").src = bird.spectrogram;

  if (bird.location && bird.location.includes(",")) {
    document.getElementById("bird-location").textContent = bird.location;
    lastLatLon = bird.location.split(",").map(Number);
  } else {
    document.getElementById("bird-location").textContent = "(ไม่ทราบตำแหน่ง)";
    lastLatLon = null;
  }

  const playBtn = document.getElementById("bird-audio-btn");
  playBtn.textContent = " 🔊 ";
  playBtn.onclick = () => {
    if (currentAudio) {
      currentAudio.pause();
      playBtn.textContent = "🔈";
    }
    const audio = new Audio("audio/" + bird.file);
    currentAudio = audio;
    if (audio.paused) {
      audio.play();
      playBtn.textContent = "🎵";
    } else {
      audio.pause();
      playBtn.textContent = "🔈";
    }
    audio.onended = () => {
      playBtn.textContent = "🔊";
      currentAudio = null;
    };
  };
}
function submitFeedback(choice) {
  const bird = birdData[currentIndex];
  const now = new Date();
  const entry = {
    file: bird.file,
    species: bird.species,
    feedback: choice,
    date: bird.date,
    time: bird.time,
    country: bird.country,
    location: bird.location,
    spectrogram: bird.spectrogram,
    image: bird.image,
    timestamp: now.toISOString()
  };
  let log = JSON.parse(localStorage.getItem("feedback_log") || "[]");
  log.push(entry);
  localStorage.setItem("feedback_log", JSON.stringify(log));

  currentIndex++;
  if (currentIndex < birdData.length) {
    loadBird(currentIndex);
  } else {
    alert("ขอบคุณสำหรับ feedback!");
    document.getElementById("bird-card").style.display = "none";
    
  }
}

// ✅ เปิด popup map พร้อม reset map instance
document.getElementById("bird-location").addEventListener("click", () => {
  if (!lastLatLon) {
    alert("ไม่มีพิกัด");
    return;
  }

  document.getElementById("map-popup").style.display = "flex";

  setTimeout(() => {
    // Reset Leaflet instance เพื่อป้องกัน error
    if (L.DomUtil.get('popup-map') != null) {
      L.DomUtil.get('popup-map')._leaflet_id = null;
    }

    const map = L.map("popup-map").setView(lastLatLon, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const bird = birdData[currentIndex];
    const popupHtml = `
      <strong>${bird.species}</strong><br/>
      <img src="image/${bird.image}" width="100" style="margin-top:5px">
    `;

    L.marker(lastLatLon)
      .addTo(map)
      .bindPopup(popupHtml)
      .openPopup();
  }, 100);
});

function closeMapPopup() {
  document.getElementById("map-popup").style.display = "none";
  document.getElementById("popup-map").innerHTML = "";
}

// popup ภาพ spectrogram
document.getElementById("open-spectrogram").addEventListener("click", () => {
  document.getElementById("img-popup").style.display = "flex";
});
function closeImgPopup() {
  document.getElementById("img-popup").style.display = "none";
}

// โหลดข้อมูลนก
fetch("data/bird_data.json") 
  .then(res => res.json())
  .then(data => {
    birdData = data;
    loadBird(currentIndex);
  })
  .catch(err => console.error("โหลดข้อมูลไม่สำเร็จ", err));
