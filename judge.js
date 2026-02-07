/*********************************
 * FIREBASE + INDEXED DB SETUP
 *********************************/
import { firebaseDB } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let db;
const request = indexedDB.open("UserDB", 4);

request.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "email" });
  }
  if (!db.objectStoreNames.contains("judgeScores")) {
    db.createObjectStore("judgeScores", {
      keyPath: "id",
      autoIncrement: true
    });
  }
};

request.onsuccess = e => {
  db = e.target.result;
  syncScoresToFirebase();
};

/*********************************
 * SIMULATION STATE & VARIABLES
 *********************************/
let earnedBadges = [];
let current = 0;
let totalScore = 0;
let selected = false;
let gameOver = false;
let selectedClass = null;
let lang = localStorage.getItem("lang") || "en";
let labels = {};

const userEmail = localStorage.getItem("loggedInEmail");
if (!userEmail) {
  alert("Please login first");
  window.location.href = "login.html";
}

/*********************************
 * CLASS-BASED QUESTION BANK
 *********************************/
const questionBank = {
  en: {
    "8_9": [
      {
        text: "Do you like helping people even if you get nothing in return?",
        options: [
          { text: "No", score: 0 },
          { text: "Sometimes", score: 5 },
          { text: "Yes always", score: 10 }
        ]
      },
      {
        text: "Two friends are fighting. What will you do?",
        options: [
          { text: "Ignore them", score: 0 },
          { text: "Support my friend only", score: 5 },
          { text: "Listen to both sides fairly", score: 10 }
        ]
      },
      {
        text: "Do you have patience to listen to long problems?",
        options: [
          { text: "No", score: 0 },
          { text: "Little", score: 5 },
          { text: "Yes, calmly", score: 10 }
        ]
      }
    ],
    "10": [
      {
        text: "A rich and poor person commit the same mistake. Your decision?",
        options: [
          { text: "Punish poor more", score: 0 },
          { text: "Ignore rich person", score: 5 },
          { text: "Same judgment for both", score: 10 }
        ]
      },
      {
        text: "Would you judge based on emotions or evidence?",
        options: [
          { text: "Emotions", score: 0 },
          { text: "Both equally", score: 5 },
          { text: "Evidence first", score: 10 }
        ]
      },
      {
        text: "If your friend is guilty?",
        options: [
          { text: "Save friend", score: 0 },
          { text: "Warn privately", score: 5 },
          { text: "Be fair & unbiased", score: 10 }
        ]
      }
    ],
    "elder": [
      {
        text: "No proof but strong suspicion. What will you do?",
        options: [
          { text: "Punish anyway", score: 0 },
          { text: "Let go completely", score: 5 },
          { text: "Investigate deeper", score: 10 }
        ]
      },
      {
        text: "Law vs morality conflict?",
        options: [
          { text: "Follow emotions", score: 0 },
          { text: "Mix both", score: 5 },
          { text: "Follow law with reasoning", score: 10 }
        ]
      },
      {
        text: "Media pressures you for quick judgment.",
        options: [
          { text: "Give fast judgment", score: 0 },
          { text: "Delay without reason", score: 5 },
          { text: "Decide only after full review", score: 10 }
        ]
      }
    ]
  },
  hi: {
    // Add Hindi translations here following the same structure as 'en'
  }
};

/*********************************
 * UI ELEMENTS
 *********************************/
const startBtn = document.getElementById("startBtn");
const classSelect = document.getElementById("classSelect");
const simulationArea = document.getElementById("simulationArea");
const classSelection = document.getElementById("classSelection");
const caseBox = document.getElementById("caseBox");
const optionsBox = document.getElementById("options");
const scoreText = document.getElementById("scoreText");
const nextBtn = document.getElementById("nextBtn");

/*********************************
 * CLASS SELECTION LOGIC
 *********************************/
if (startBtn) {
  startBtn.onclick = () => {
    if (!classSelect.value) {
      alert("Please select class");
      return;
    }

    if (classSelect.value === "8" || classSelect.value === "9") {
      selectedClass = "8_9";
    } else if (classSelect.value === "10") {
      selectedClass = "10";
    } else {
      selectedClass = "elder";
    }

    classSelection.style.display = "none";
    simulationArea.style.display = "block";
    resetSimulation();
  };
}

/*********************************
 * BADGE SYSTEM
 *********************************/
function checkBadge(score) {
  const badges = {
    10: lang === "en" ? "Law Booster" : "कानून बूस्टर",
    20: lang === "en" ? "Law Expert" : "कानून विशेषज्ञ",
    30: lang === "en" ? "Law Master" : "कानून मास्टर"
  };

  if (badges[score] && !earnedBadges.includes(score)) {
    earnedBadges.push(score);
    showBadgePopup(badges[score]);
  }
}

function showBadgePopup(badgeName) {
  const popup = document.getElementById("badgePopup");
  const title = document.getElementById("badgeTitle");
  const message = document.getElementById("badgeMessage");
  const closeBtn = document.getElementById("closeBadge");

  if (!popup) return;

  title.innerText = lang === "en" ? "Badge Earned!" : "बैज प्राप्त हुआ!";
  message.innerText =
    lang === "en"
      ? `Congratulations! You have earned the "${badgeName}" badge.`
      : `बधाई हो! आपको "${badgeName}" बैज मिला है।`;

  popup.style.display = "flex";
  setTimeout(() => (popup.style.display = "none"), 1500);
  closeBtn.onclick = () => (popup.style.display = "none");
}

/*********************************
 * SIMULATION LOGIC
 *********************************/
function loadCase() {
  selected = false;
  nextBtn.disabled = true;
  optionsBox.innerHTML = "";

  const data = questionBank[lang][selectedClass][current];
  caseBox.innerText = data.text;

  data.options.forEach(opt => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerText = opt.text;
    div.onclick = () => selectOption(div, opt.score);
    optionsBox.appendChild(div);
  });
}

function selectOption(el, score) {
  if (selected || gameOver) return;
  selected = true;

  document.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
  el.classList.add("selected");

  totalScore += score;
  scoreText.innerText = (lang === "en" ? "Score: " : "स्कोर: ") + totalScore;

  nextBtn.disabled = false;
  checkBadge(totalScore);
}

nextBtn.onclick = () => {
  current++;
  if (current < questionBank[lang][selectedClass].length) {
    loadCase();
  } else {
    finishSimulation();
  }
};

function resetSimulation() {
  current = 0;
  totalScore = 0;
  earnedBadges = [];
  gameOver = false;
  scoreText.innerText = lang === "en" ? "Score: 0" : "स्कोर: 0";
  nextBtn.style.display = "block";
  loadCase();
}

/*********************************
 * SAVE & SYNC DATA
 *********************************/
function finishSimulation() {
  gameOver = true;
  caseBox.innerHTML = `<h3>${lang === "en" ? "Final Score" : "अंतिम स्कोर"}: ${totalScore}</h3>`;
  optionsBox.innerHTML = "";
  nextBtn.style.display = "none";

  if (!db) return;

  const tx = db.transaction("judgeScores", "readwrite");
  const store = tx.objectStore("judgeScores");
  store.add({
    email: userEmail,
    score: totalScore,
    synced: false,
    timestamp: new Date().toISOString()
  });

  syncScoresToFirebase();
}

async function saveScoreToFirebase(obj) {
  const ref = doc(firebaseDB, "leaderboard", obj.email);
  const snap = await getDoc(ref);

  // Only update if new score is higher
  if (!snap.exists() || snap.data().score < obj.score) {
    await setDoc(ref, {
      email: obj.email,
      score: obj.score,
      updatedAt: serverTimestamp()
    });
  }
}

function syncScoresToFirebase() {
  if (!db) return;

  const tx = db.transaction("judgeScores", "readwrite");
  const store = tx.objectStore("judgeScores");

  store.getAll().onsuccess = async e => {
    const results = e.target.result;
    for (const r of results.filter(x => !x.synced)) {
      try {
        await saveScoreToFirebase(r);
        r.synced = true;
        const updateTx = db.transaction("judgeScores", "readwrite");
        updateTx.objectStore("judgeScores").put(r);
      } catch (err) {
        console.error("Sync failed for:", r.email, err);
      }
    }
  };
}

/*********************************
 * INIT
 *********************************/
document.addEventListener("DOMContentLoaded", () => {
  // If user is already in simulation (page refresh), this handles clean state
  if (simulationArea.style.display !== "none" && selectedClass) {
    loadCase();
  }
});