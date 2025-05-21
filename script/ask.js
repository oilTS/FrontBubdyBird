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

  // พิกัด
  if (bird.location && bird.location.includes(",")) {
    document.getElementById("bird-location").textContent = bird.location;
    lastLatLon = bird.location.split(",").map(Number);
  } else {
    document.getElementById("bird-location").textContent = "(ไม่ทราบตำแหน่ง)";
    lastLatLon = null;
  }

  // เล่นเสียง
  const playBtn = document.getElementById("bird-audio-btn");
  playBtn.textContent = "▶";
  playBtn.onclick = () => {
    if (currentAudio) {
      currentAudio.pause();
      playBtn.textContent = "▶";
    }
    const audio = new Audio("audio/" + bird.file);
    currentAudio = audio;
    audio.play();
    playBtn.textContent = "⏸";
    audio.onended = () => {
      playBtn.textContent = "▶";
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

// คลิกที่ lat,lon แล้วเปิดแผนที่
document.getElementById("bird-location").addEventListener("click", () => {
  if (!lastLatLon) {
    alert("ไม่มีพิกัด");
    return;
  }
  document.getElementById("map-popup").style.display = "flex";
  setTimeout(() => {
    const map = L.map("popup-map").setView(lastLatLon, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker(lastLatLon).addTo(map).bindPopup("ตำแหน่งนก").openPopup();
  }, 100);
});

function closeMapPopup() {
  document.getElementById("map-popup").style.display = "none";
  document.getElementById("popup-map").innerHTML = "";
}

// popup spectrogram
document.getElementById("open-spectrogram").addEventListener("click", () => {
  document.getElementById("img-popup").style.display = "flex";
});
function closeImgPopup() {
  document.getElementById("img-popup").style.display = "none";
}

fetch("data/bird_data.json")
  .then(res => res.json())
  .then(data => {
    birdData = data;
    loadBird(currentIndex);
  })
  .catch(err => console.error("โหลดข้อมูลไม่สำเร็จ", err))