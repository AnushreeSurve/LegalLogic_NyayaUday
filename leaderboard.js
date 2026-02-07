let lang = localStorage.getItem("lang") || "en";
let labels = {};
async function loadLanguage() {
  const res = await fetch(`./json/lang_${lang}.json`);
  labels = await res.json();
  applyLanguage();
}
function applyLanguage() {
  document.getElementById("welcome-header").innerText = labels.welcome;

  // Assistant page
  if (document.getElementById("userInput")) {
    document.querySelector("h2").innerText = labels.enter_question;
    document.getElementById("userInput").placeholder =
      labels.placeholder_question;
    document.querySelector("button").innerText = labels.submit;
  }

  // Navbar
  document.querySelectorAll(".navbar a").forEach((link) => {
    const key = link.getAttribute("data-i18n");
    if (key) link.innerText = labels.navbar[key];
  });
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "en" ? "hi" : "en";
  localStorage.setItem("lang", lang);
  loadLanguage();

  document.getElementById("langToggle").innerText =
    lang === "en" ? "हिंदी" : "English";
});

import { firebaseDB } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const leaderboardRef = query(
  collection(firebaseDB, "leaderboard"),
  orderBy("score", "desc"),
);

onSnapshot(leaderboardRef, (snapshot) => {
  const users = [];

  snapshot.forEach((doc) => {
    users.push(doc.data());
  });

  renderLeaderboard(users);
});

function renderLeaderboard(users) {
  const podium = document.getElementById("podium");
  const container = document.getElementById("leaderboard");

  podium.innerHTML = "";
  container.innerHTML = "";

  // 🥇 TOP 3 PODIUM
  const [first, second, third] = users.slice(0, 3);

  function createPodiumCard(user, place, crown, rank) {
    const card = document.createElement("div");
    card.className = `podium-card podium-${place}`;

    card.innerHTML = `
    <div class="podium-crown">${crown}</div>
    <div class="podium-avatar">${user.email[0].toUpperCase()}</div>
    <div class="podium-name">${user.email}</div>
    <div class="podium-score">${user.score} pts</div>
    <div class="podium-rank">${rank}</div>
  `;

    return card;
  }

  // 🥈 LEFT
  podium.appendChild(createPodiumCard(second, "second", "🥈", 2));

  // 🥇 CENTER (WINNER)
  podium.appendChild(createPodiumCard(first, "first", "👑", 1));

  // 🥉 RIGHT
  podium.appendChild(createPodiumCard(third, "third", "🥉", 3));

  // 📋 REST OF LEADERBOARD
  users.slice(3).forEach((user, index) => {
    const row = document.createElement("div");
    row.className = "row";

    if (user.email === localStorage.getItem("loggedInEmail")) {
      row.classList.add("me");
    }

    row.innerHTML = `
      <div class="rank">${index + 4}</div>
      <div class="name">${user.email}</div>
      <div class="points">${user.score}</div>
    `;

    container.appendChild(row);
  });
}
