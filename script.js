// Drag & Drop
const zones = document.querySelectorAll(".zone");
const boxes = document.querySelectorAll(".box");

zones.forEach(zone => {
  zone.addEventListener("dragstart", () => {
    zone.classList.add("dragging");
  });

  zone.addEventListener("dragend", () => {
    zone.classList.remove("dragging");
  });
});

boxes.forEach(box => {
  box.addEventListener("dragover", e => e.preventDefault());
  box.addEventListener("drop", e => {
    e.preventDefault();
    const dragged = document.querySelector(".dragging");
    if (!dragged) return;

    box.appendChild(dragged);
    const zoneName = dragged.id;
    const boxName = box.id;

    const timestamp = Date.now();
    db.ref("zones/" + zoneName).set({
      box: boxName,
      time: timestamp
    });
  });
});

// Firebase real-time updates
db.ref("zones").on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;

  Object.keys(data).forEach(zoneId => {
    const zoneInfo = data[zoneId];
    const zone = document.getElementById(zoneId);
    const targetBox = document.getElementById(zoneInfo.box);

    if (zone && targetBox && targetBox !== zone.parentElement) {
      targetBox.appendChild(zone);
    }

    // Calculate and display elapsed time
    if (zoneInfo.time && zoneInfo.box === "dispatched") {
      const diff = Math.floor((Date.now() - zoneInfo.time) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      zone.textContent = `${zoneId} (${mins}m ${secs}s)`;
    } else {
      zone.textContent = zoneId;
    }
  });
});
