# BuddyBird project

## 🐦 Bird Species Detection from Sound

This project is a serverless bird species detection system built using cloud services. Users can upload bird sound recordings, which are then processed to identify the bird species and visualize the location where the sound was recorded. The system combines machine learning, audio signal processing, and interactive web design to provide both a user-friendly experience and accurate species identification.

This project is part of **CS232: Introduction to Cloud Computing Technology** course. 

---

### 🔍 Key Features

* **📤 Bird Sound Upload**
  Upload a bird call or song in audio format. The sound will be processed through our serverless backend pipeline.

* **🗺️ Interactive Map**
  See all identified birds pinned to a map, showing the approximate location each bird was recorded.

* **📊 Bird Species Dashboard**
  A summary table listing identified species, their locations, and access to each bird’s original sound and generated spectrogram.

* **📈 Spectrogram Export**
  Each sound file is converted into a spectrogram image for analysis or educational use.

---

### ⚙️ How It Works

1. **Upload & Storage**
   The sound file is uploaded to an Amazon S3 bucket, triggering a Lambda function.

2. **Sound Processing**
   Using AWS Lambda and integrated ML tools, noise is reduced and the species is predicted based on sound patterns. The file is also converted into a spectrogram.

3. **Data Display**
   Results are updated on the map and dashboard in real-time, giving a complete overview of bird activity and enabling feedback for model improvement.

---

### ☁️ Cloud Services Used

* **AWS S3** – Storage for uploaded sound files and processed outputs
* **AWS Lambda** – Serverless functions to handle file processing and prediction
* ...


---


***Group 15***  
> **Note:** This is the first version of the web page, with no connection to the real backend system. The information here is just a mockup. For the updated version, go to: #
