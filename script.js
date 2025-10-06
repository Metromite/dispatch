import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Sample data for demo
const sampleZones = ["Zone A", "Zone B", "Zone C", "Zone D"];
const pendingContainer = document.getElementById("pendingZones");

sampleZones.forEach(zone => {
  const el = document.createElement("div");
  el.className = "zone pending";
  el.textContent = zone;
  el.draggable = true;
  el.id = zone;
  pendingContainer.appendChild(el);
});

// Drag & Drop Logic
document.querySelectorAll(".zone").forEach(zone => {
  zone.addEventListener("dragstart", e => e.dataTransfer.setData("text", e.target.id));
});

document.querySelectorAll(".bay, #dispatchedZones").forEach(target => {
  target.addEventListener("dragover", e => e.preventDefault());
  target.addEventListener("drop", e => {
    const zoneId = e.dataTransfer.getData("text");
    const zoneEl = document.getElementById(zoneId);
    target.appendChild(zoneEl);
  });
});
