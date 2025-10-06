// --- Firebase Initialization ---
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
const database = firebase.database();

// --- DOM Elements ---
const pendingList = document.getElementById("waitingList");
const bays = document.querySelectorAll(".gate");
const dispatchedList = document.getElementById("dispatchedZones");

// --- Sample Pending Zones (you can add more if needed) ---
const pendingZones = [
  "Fujairah", "Ras Al Khaimah", "Jabal Ali", "Al Quoz 2",
  "Al Quoz 1", "Mirdiff", "Bur Dubai", "Sharjah-Buhairah",
  "Jumeirah", "Al Qusais", "Deira", "Ajman", "Sharjah-Sanayia"
];

// --- Render Pending Zones ---
function renderPendingZones() {
  pendingList.innerHTML = "";
  pendingZones.forEach(zone => {
    const div = document.createElement("div");
    div.className = "zone waiting";
    div.draggable = true;
    div.id = zone;
    div.textContent = zone;
    addDragEvents(div);
    pendingList.appendChild(div);
  });
}

// --- Drag Events ---
function addDragEvents(element) {
  element.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", e.target.id);
  });
}

bays.forEach(bay => {
  bay.addEventListener("dragover", e => e.preventDefault());
  bay.addEventListener("drop", e => {
    e.preventDefault();
    const zoneId = e.dataTransfer.getData("text/plain");
    const zone = document.getElementById(zoneId);
    if (zone) {
      bay.appendChild(zone);
      zone.classList.remove("waiting");
      zone.classList.add("in-gate");
      updateDatabase(zoneId, bay.id);
    }
  });
});

dispatchedList.addEventListener("dragover", e => e.preventDefault());
dispatchedList.addEventListener("drop", e => {
  e.preventDefault();
  const zoneId = e.dataTransfer.getData("text/plain");
  const zone = document.getElementById(zoneId);
  if (zone) {
    dispatchedList.appendChild(zone);
    zone.classList.remove("in-gate");
    zone.classList.add("dispatched");
    updateDatabase(zoneId, "dispatched");
  }
});

// --- Update Database ---
function updateDatabase(zoneId, location) {
  firebase.database().ref("zones/" + zoneId).set({
    location: location,
    timestamp: Date.now()
  });
}

// --- Listen for Realtime Updates ---
firebase.database().ref("zones").on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;

  Object.keys(data).forEach(zoneId => {
    const zoneData = data[zoneId];
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    if (zoneData.location === "dispatched") {
      dispatchedList.appendChild(zone);
      zone.className = "zone dispatched";
    } else if (zoneData.location.startsWith("bay")) {
      document.getElementById(zoneData.location).appendChild(zone);
      zone.className = "zone in-gate";
    } else {
      pendingList.appendChild(zone);
      zone.className = "zone waiting";
    }
  });
});

// --- Start ---
renderPendingZones();
