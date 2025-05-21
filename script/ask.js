let currentIndex = 0;
let birdData = [];

function loadBird(index) {
  const bird = birdData[index];
  document.getElementById("bird-image").src = "images/" + bird.image;
  document.getElementById("bird-audio").src = "audio/" + bird.file;
  document.getElementById("bird-species").textContent = bird.species;
}

function submitFeedback(feedback) {
  const bird = birdData[currentIndex];
  const result = {
    file: bird.file,
    species: bird.species,
    feedback: feedback
  };
  console.log("Feedback:", result);
  // TODO: POST to backend here if available

  currentIndex++;
  if (currentIndex < birdData.length) {
    loadBird(currentIndex);
  } else {
    alert("ขอบคุณสำหรับการช่วยตรวจสอบข้อมูล!");
    document.getElementById("bird-card").style.display = "none";
  }
}

fetch("data/bird_data.json")
  .then(res => res.json())
  .then(data => {
    birdData = data;
    loadBird(currentIndex);
  })
  .catch(err => console.error("โหลด bird_data.json ไม่สำเร็จ", err));