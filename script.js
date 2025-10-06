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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ================= Select DOM Elements =================
const zones = document.querySelectorAll(".zone");
const bays = document.querySelectorAll(".bay");
const dispatchedArea = document.getElementById("dispatched");
const pendingArea = document.getElementById("zoneList");

// ================= Drag & Drop =================
zones.forEach(zone => {
  zone.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", zone.id);
  });
});

[...bays, dispatchedArea, pendingArea].forEach(area => {
  area.addEventListener("dragover", e => e.preventDefault());
  area.addEventListener("drop", e => {
    e.preventDefault();
    const zoneId = e.dataTransfer.getData("text/plain");
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    moveZone(zone, area);
  });
});

// ================= Move Zone Function =================
function moveZone(zone, targetArea) {
  // Remove previous timers or labels
  if (zone.dataset.interval) {
    clearInterval(zone.dataset.interval);
    delete zone.dataset.interval;
  }
  zone.classList.remove("in-bay", "dispatched", "pending");
  const oldTimer = zone.querySelector(".bay-timer");
  if (oldTimer) oldTimer.remove();
  const oldDispatch = zone.querySelector(".dispatched-time");
  if (oldDispatch) oldDispatch.remove();

  targetArea.appendChild(zone);
  const now = new Date();

  if (targetArea.classList.contains("bay")) {
    zone.classList.add("in-bay");
    const timerDisplay = document.createElement("span");
    timerDisplay.classList.add("bay-timer");
    zone.appendChild(timerDisplay);

    const start = now;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date() - start) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      timerDisplay.textContent = `⏱ ${minutes}m ${seconds}s`;
    }, 1000);
    zone.dataset.interval = interval;

    db.ref("dispatch/" + zone.id).set({
      zone: zone.id,
      status: "in-bay",
      bay: targetArea.id,
      startTime: start.toISOString()
    });
  } else if (targetArea.id === "dispatched") {
    zone.classList.add("dispatched");
    const label = document.createElement("span");
    label.classList.add("dispatched-time");
    label.textContent = `(Dispatched at: ${now.toLocaleTimeString()})`;
    zone.appendChild(label);

    db.ref("dispatch/" + zone.id).update({
      status: "dispatched",
      dispatchedTime: now.toISOString()
    });
  } else if (targetArea.id === "zoneList") {
    zone.classList.add("pending");
    db.ref("dispatch/" + zone.id).set({
      zone: zone.id,
      status: "pending"
    });
  }
}

// ================= Real-time Listener =================
db.ref("dispatch").on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;

  Object.keys(data).forEach(zoneId => {
    const zoneData = data[zoneId];
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    if (zone.dataset.interval) {
      clearInterval(zone.dataset.interval);
      delete zone.dataset.interval;
    }

    zone.classList.remove("in-bay", "dispatched", "pending");
    const oldTimer = zone.querySelector(".bay-timer");
    if (oldTimer) oldTimer.remove();
    const oldDispatch = zone.querySelector(".dispatched-time");
    if (oldDispatch) oldDispatch.remove();

    if (zoneData.status === "in-bay") {
      const bay = document.getElementById(zoneData.bay);
      if (!bay) return;
      bay.appendChild(zone);
      zone.classList.add("in-bay");

      const timerDisplay = document.createElement("span");
      timerDisplay.classList.add("bay-timer");
      zone.appendChild(timerDisplay);

      const start = new Date(zoneData.startTime);
      const interval = setInterval(() => {
        const diff = Math.floor((new Date() - start) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        timerDisplay.textContent = `⏱ ${minutes}m ${seconds}s`;
      }, 1000);
      zone.dataset.interval = interval;
    } else if (zoneData.status === "dispatched") {
      dispatchedArea.appendChild(zone);
      zone.classList.add("dispatched");
      const label = document.createElement("span");
      label.classList.add("dispatched-time");
      const t = zoneData.dispatchedTime ? new Date(zoneData.dispatchedTime).toLocaleTimeString() : new Date().toLocaleTimeString();
      label.textContent = `(Dispatched at: ${t})`;
      zone.appendChild(label);
    } else if (zoneData.status === "pending") {
      pendingArea.appendChild(zone);
      zone.classList.add("pending");
    }
  });
});
