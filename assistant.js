
let db;

const request = indexedDB.open("UserDB", 4);

request.onupgradeneeded = function (e) {
  db = e.target.result;

  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "email" });
  }
};

request.onsuccess = function (e) {
  db = e.target.result;
  console.log("✅ Assistant DB connected");
};

request.onerror = function (e) {
  console.error("❌ DB error:", e.target.error);
};

let lang = localStorage.getItem("lang") || "en";
let labels = {};
async function loadLanguage() {
  const res = await fetch(`./json/lang_${lang}.json`);
  labels = await res.json();
  applyLanguage();
}
function applyLanguage() {
  const header = document.getElementById("welcome-header");
  if (header && labels.welcome) {
    header.innerText = labels.welcome;
  }


  // Assistant page
  if (document.getElementById("userInput")) {

    const h2 = document.querySelector("h2");
    const btn = document.querySelector("button");
    const input = document.getElementById("userInput");

    if (h2 && labels.enter_question) {
      h2.innerText = labels.enter_question;
    }
    if (input && labels.placeholder_question) {
      input.placeholder = labels.placeholder_question;
    }
    if (btn && labels.submit) {
      btn.innerText = labels.submit;
    }

  }

  // Navbar
  document.querySelectorAll(".navbar a").forEach(link => {
    const key = link.getAttribute("data-i18n");
    if (key) link.innerText = labels.navbar[key];
  });
}

let recognition;

function updateSpeechLanguage() {
  if (!recognition) return;
  recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
}


const langToggle = document.getElementById("langToggle");

if (langToggle) {
  langToggle.addEventListener("click", () => {
    lang = lang === "en" ? "hi" : "en";
    localStorage.setItem("lang", lang);
    loadLanguage();
    loadData();
    updateSpeechLanguage();

    langToggle.innerText =
      lang === "en" ? "हिंदी" : "English";
  });
}

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;


if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    updateSpeechLanguage();
    recognition.continuous = false;
    recognition.interimResults = false;
} else {
    alert("Speech Recognition not supported in this browser");
}


const micBtn = document.getElementById("micBtn");
const userInput = document.getElementById("userInput");

if (micBtn && userInput) {
  micBtn.addEventListener("click", () => {
    if (!recognition) return;

    recognition.start();
    micBtn.innerText = "🎙️ Listening...";
  });
}


if (recognition && userInput && micBtn) {
  recognition.onresult = (event) => {
    userInput.value = event.results[0][0].transcript;
    micBtn.innerText = "🎤";
    handleQuestion();
  };

  recognition.onend = () => {
    micBtn.innerText = "🎤";
  };

  recognition.onerror = (event) => {
    console.error("Speech error:", event.error);
    micBtn.innerText = "🎤";
  };
}

let isSpeaking = false;
let currentUtterance = null;

let intents = {};
let rules = {};
let responses = {};

// Load all JSONs
let dataLoaded = false;

async function loadData() {
  try {
    const intentsRes = await fetch("./json/intents.json");
    const rulesRes = await fetch("./json/rules.json");
    const responsesRes = await fetch(`./json/responses_${lang}.json`);

    console.log(intentsRes.status, rulesRes.status, responsesRes.status);

    intents = await intentsRes.json();
    rules = await rulesRes.json();
    responses = await responsesRes.json();

    dataLoaded = true;
    console.log("✅ Data loaded successfully");
  } catch (err) {
    console.error("❌ Error loading JSONs:", err);
  }
}

// Call once when app loads
loadData();
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")  // keep ALL language letters
    .trim();
}


function detectIntent(userText) {

  const currentLang = lang || "en";
  const normalizedUser = normalizeText(userText);

  // PASS 1 — FULL PHRASE MATCH (highest priority)
  for (let intent in intents) {
    let phrases = intents[intent][currentLang] || [];

    for (let phrase of phrases) {
      const normalizedPhrase = normalizeText(phrase);

      if (normalizedUser.includes(normalizedPhrase)) {
        console.log(`✅ FULL MATCH: ${intent}`);
        return intent;
      }
    }
  }

  // PASS 2 — WORD MATCH (fallback)
  for (let intent in intents) {
    let phrases = intents[intent][currentLang] || [];

    for (let phrase of phrases) {
      const words = normalizeText(phrase).split(" ");

      if (words.some(w => w.length > 3 && normalizedUser.includes(w))) {
        console.log(`⚠️ WORD MATCH: ${intent}`);
        return intent;
      }
    }
  }

  return null;
}


function generateResponse(intent, userState, education) {
  console.log(`🎯 Processing: intent="${intent}", state="${userState}", education="${education}"`);
  
  // **CRITICAL FIX**: ROLE_EXPLANATION first, NO state needed
  if (intent === "ROLE_EXPLANATION") {
    const roleResponse = responses.ROLE_JUDGE?.text || 
      responses.ROLE_EXPLANATION?.text ||
      "A Judge सुनता है दोनों पक्षों को, सबूतों की जांच करता है, कानून लागू करता है, और निष्पक्ष निर्णय देता है।";
    console.log("✅ ROLE_JUDGE response:", roleResponse);
    return roleResponse;
  }
  
  // State-specific responses
  let stateData = rules[userState];
  if (!stateData && userState) {
    return `Sorry, no data for ${userState}. Try: UP, Maharashtra, Delhi, Karnataka...`;
  }
  
  let exam = stateData?.judicial_exam || "State Judicial Service";
  let llbTypes = stateData?.llb_allowed?.join(" or ") || "3-year or 5-year";
  let minAge = stateData?.min_age || 21;
  
  const responseMap = {

  "CAREER_PATH":
    responses.CAREER_AFTER_12TH?.text
      ?.replace("{llb_type}", llbTypes)
      .replace("{duration}", "5")
      .replace("{exam}", exam)
      .replace("{state}", userState)
      .replace("{min_age}", minAge),

  "EXAM_REQUIRED":
    responses.EXAM_REQUIRED?.text
      ?.replace("{state}", userState)
      .replace("{exam}", exam),

  "ROLE_EXPLANATION":
    responses.ROLE_EXPLANATION?.text,

  "AGE_ELIGIBILITY":
    responses.AGE_RESPONSE?.text
      ?.replace("{exam}", exam)
      .replace("{state}", userState)
      .replace("{min_age}", minAge),

  "LLB_QUESTION":
    responses.LLB_GUIDANCE?.text
      ?.replace("{state}", userState)
      .replace("{llb_type}", llbTypes)
      .replace("{duration}", "5"),

  "EXAM_PATTERN":
    responses.EXAM_PATTERN?.text
      ?.replace("{exam}", exam),

  "PREPARATION_TIPS":
    responses.PREP_TIPS?.text,

  // fallback (optional)
  "GENERAL_PATH":
    responses.GENERAL_PATH?.text
      ?.replace("{exam}", exam)
  };
  
  const response = responseMap[intent] || 
    "I can help with judicial career, exams, eligibility, and judge role questions!";
  
  console.log("📤 Final response:", response);
  return response;
}


function handleQuestion() {
  if (!dataLoaded) {
    alert("Data is still loading, please wait...");
    return;
  }

  if (!db) {
    alert("Database not ready yet.");
    return;
  }

  const inputEl = document.getElementById("userInput");
  const output = document.getElementById("output");

  if (!inputEl || !output) return;

  const input = inputEl.value;

  const normalizedText = normalizeText(input);
  const intent = detectIntent(normalizedText);

  if (!intent) {
    output.innerText = "Sorry, I didn’t understand the question. Check that your language setting matches your question. ";
    return;
  }

  const email = localStorage.getItem("loggedInEmail");

  const tx = db.transaction("users", "readonly");
  const store = tx.objectStore("users");
  const req = store.get(email);

  req.onsuccess = () => {
    const user = req.result;

    if (!user) {
      output.innerText = "User data not found.";
      return;
    }

    const userState = user.state;
    const education = user.education;

    const answer = generateResponse(intent, userState, education);
    output.innerText = answer;

    const speakBtn = document.getElementById("speakBtn");
    if (speakBtn) speakBtn.style.display = "block";


  };

  console.log("🔍 User:", input);
  console.log("📝 Normalized:", normalizedText);
  console.log("🎯 Intent:", intent);
  console.log("🏛️ State:", userState);

}

function speakResponse(text) {
  if (!window.speechSynthesis) return;

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speakBtn.innerText = "🔊 Speak";
    return;
  }

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1;

  currentUtterance.onend = () => {
    isSpeaking = false;
    speakBtn.innerText = "🔊 Speak";
  };

  window.speechSynthesis.speak(currentUtterance);
  isSpeaking = true;
  speakBtn.innerText = "⏹ Stop";
}

const speakBtn = document.getElementById("speakBtn");

if (speakBtn) {
  speakBtn.addEventListener("click", () => {
    const text = document.getElementById("output").innerText;
    if (text) speakResponse(text);
  });
}


loadLanguage();
