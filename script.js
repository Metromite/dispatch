// ======= DOM Elements =======
const zones = document.querySelectorAll(".zone");
const bays = document.querySelectorAll(".gate"); // your bays
const dispatchedArea = document.getElementById("dispatched");
const pendingArea = document.getElementById("zoneList"); // Pending Zones

// ======= Drag & Drop =======
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

// ======= Move Zone Function =======
function moveZone(zone, target) {
  // Clear any previous timers
  if (zone.dataset.interval) clearInterval(zone.dataset.interval);

  // Remove old classes
  zone.classList.remove("in-gate", "dispatched", "pending");
  const oldTimer = zone.querySelector(".gate-timer");
  if (oldTimer) oldTimer.remove();
  const oldDispatch = zone.querySelector(".dispatched-time");
  if (oldDispatch) oldDispatch.remove();

  // Append to new area
  target.appendChild(zone);

  const now = new Date();

  // If moved to bay
  if (target.classList.contains("gate")) {
    zone.classList.add("in-gate");
    const timerDisplay = document.createElement("span");
    timerDisplay.classList.add("gate-timer");
    zone.appendChild(timerDisplay);

    const start = now;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date() - start) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      timerDisplay.textContent = `⏱ ${minutes}m ${seconds}s`;
    }, 1000);
    zone.dataset.interval = interval;

    // Update Firebase
    set(ref(db, "dispatch/" + zone.id), {
      zone: zone.id,
      status: "in-bay",
      bay: target.id,
      startTime: start.toISOString()
    });

  } else if (target.id === "dispatched") {
    zone.classList.add("dispatched");
    const label = document.createElement("span");
    label.classList.add("dispatched-time");
    label.textContent = `(Dispatched at: ${now.toLocaleTimeString()})`;
    zone.appendChild(label);

    update(ref(db, "dispatch/" + zone.id), {
      status: "dispatched",
      dispatchedTime: now.toISOString()
    });

  } else if (target.id === "zoneList") {
    zone.classList.add("pending");
    set(ref(db, "dispatch/" + zone.id), {
      zone: zone.id,
      status: "pending"
    });
  }
}

// ======= Real-time Listener =======
onValue(ref(db, "dispatch"), snapshot => {
  const data = snapshot.val();
  if (!data) return;

  Object.keys(data).forEach(zoneId => {
    const zoneData = data[zoneId];
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    if (zone.dataset.interval) clearInterval(zone.dataset.interval);

    zone.classList.remove("in-gate", "dispatched", "pending");
    const oldTimer = zone.querySelector(".gate-timer");
    if (oldTimer) oldTimer.remove();
    const oldDispatch = zone.querySelector(".dispatched-time");
    if (oldDispatch) oldDispatch.remove();

    if (zoneData.status === "in-bay") {
      const bay = document.getElementById(zoneData.bay);
      if (!bay) return;
      bay.appendChild(zone);
      zone.classList.add("in-gate");

      const timerDisplay = document.createElement("span");
      timerDisplay.classList.add("gate-timer");
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
