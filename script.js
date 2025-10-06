// ================= Firebase Setup =================
const firebaseConfig = {
  apiKey: "AIzaSyA9n5lGdlNkgMmC570jArJwKY5P2c_XkcY",
  authDomain: "dispatchsystem-23f47.firebaseapp.com",
  databaseURL: "https://dispatchsystem-23f47-default-rtdb.firebaseio.com",
  projectId: "dispatchsystem-23f47",
  storageBucket: "dispatchsystem-23f47.firebasestorage.app",
  messagingSenderId: "131590857859",
  appId: "1:131590857859:web:5959b6d9d9655fdd0ba7b6",
  measurementId: "G-49GJE4J123"
};

// Initialize Firebase (compat SDK behaves like normal scripts)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ================= Drag & Drop Logic (like original) =================
const zones = document.querySelectorAll(".zone");
const gates = document.querySelectorAll(".gate");
const dispatchedArea = document.getElementById("dispatched");
const waitingArea = document.getElementById("zoneList");

zones.forEach(zone => {
  zone.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", zone.id);
  });
});

[...gates, dispatchedArea, waitingArea].forEach(area => {
  area.addEventListener("dragover", e => e.preventDefault());
  area.addEventListener("drop", e => {
    e.preventDefault();
    const zoneId = e.dataTransfer.getData("text/plain");
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    // Stop any running timer
    if (zone.dataset.interval) {
      clearInterval(zone.dataset.interval);
      delete zone.dataset.interval;
    }

    // Reset visuals
    zone.classList.remove("in-gate", "dispatched", "waiting");
    const oldTimer = zone.querySelector(".gate-timer");
    if (oldTimer) oldTimer.remove();
    const oldDispatched = zone.querySelector(".dispatched-time");
    if (oldDispatched) oldDispatched.remove();

    // Move element
    e.currentTarget.appendChild(zone);

    // Gate logic
    if (e.currentTarget.classList.contains("gate")) {
      zone.classList.add("in-gate");
      const timerDisplay = document.createElement("span");
      timerDisplay.classList.add("gate-timer");
      zone.appendChild(timerDisplay);

      const start = new Date();
      const interval = setInterval(() => {
        const diff = Math.floor((new Date() - start) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        timerDisplay.textContent = `⏱ ${minutes}m ${seconds}s`;
      }, 1000);
      zone.dataset.interval = interval;

      db.ref("dispatch/" + zone.id).set({
        zone: zone.id,
        status: "in-gate",
        gate: e.currentTarget.id,
        startTime: start.toISOString()
      });
    }

    // Dispatched
    else if (e.currentTarget.id === "dispatched") {
      zone.classList.add("dispatched");
      const now = new Date();
      const label = document.createElement("span");
      label.classList.add("dispatched-time");
      label.textContent = `(Dispatched at: ${now.toLocaleTimeString()})`;
      zone.appendChild(label);

      db.ref("dispatch/" + zone.id).update({
        status: "dispatched",
        dispatchedTime: now.toISOString()
      });
    }

    // Waiting
    else if (e.currentTarget.id === "zoneList") {
      zone.classList.add("waiting");
      db.ref("dispatch/" + zone.id).set({
        zone: zone.id,
        status: "waiting"
      });
    }
  });
});
