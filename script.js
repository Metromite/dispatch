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
const pendingArea = document.getElementById("pendingZones");

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
  zone.classList.remove("in-bay", "dispatched", "waiting");
  targetArea.appendChild(zone);

  const now = new Date();

  if (targetArea.classList.contains("bay")) {
    zone.classList.add("in-bay");

    db.ref("dispatch/" + zone.id).set({
      zone: zone.id,
      status: "in-bay",
      bay: targetArea.id,
      startTime: now.toISOString()
    });
  } else if (targetArea.id === "dispatched") {
    zone.classList.add("dispatched");

    db.ref("dispatch/" + zone.id).update({
      status: "dispatched",
      dispatchedTime: now.toISOString()
    });
  } else if (targetArea.id === "pendingZones") {
    zone.classList.add("waiting");

    db.ref("dispatch/" + zone.id).set({
      zone: zone.id,
      status: "waiting"
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

    zone.classList.remove("in-bay", "dispatched", "waiting");

    if (zoneData.status === "in-bay") {
      const bay = document.getElementById(zoneData.bay);
      if (bay) bay.appendChild(zone);
      zone.classList.add("in-bay");
    } else if (zoneData.status === "dispatched") {
      dispatchedArea.appendChild(zone);
      zone.classList.add("dispatched");
    } else if (zoneData.status === "waiting") {
      pendingArea.appendChild(zone);
      zone.classList.add("waiting");
    }
  });
});
