let lang = localStorage.getItem("lang") || "en";
let roadmaps = {};
let labels = {};

// =====================
// Load language labels
// =====================
async function loadLanguage() {
  const res = await fetch(`./json/lang_${lang}.json`);
  labels = await res.json();

  document.getElementById("welcome-header").innerText = labels.welcome;

  document.querySelectorAll(".navbar a").forEach(link => {
    const key = link.getAttribute("data-i18n");
    if (key) link.innerText = labels.navbar[key];
  });

  document.getElementById("langToggle").innerText =
    lang === "en" ? "हिंदी" : "English";
}


// =====================
// Load roadmap JSON
// =====================
async function loadRoadmap() {
  const fileName = lang === "hi" ? "roadmaps_hi.json" : "roadmaps.json";
  try {
    const res = await fetch(`./json/${fileName}`);
    roadmaps = await res.json();
    console.log("✅ Roadmaps loaded:", roadmaps);
  } catch (err) {
    console.error("❌ Error loading roadmap JSON:", err);
  }
}


// =====================
// Render roadmap
// =====================
function renderRoadmap(state, education) {
  const roadmapDiv = document.getElementById("roadmap");
  roadmapDiv.innerHTML = "";

  if (!roadmaps[state]) {
    roadmapDiv.innerText = lang === "hi" 
      ? "चयनित राज्य के लिए रोडमैप उपलब्ध नहीं है।" 
      : "Roadmap not available for selected state.";
    return;
  }

  const stateData = roadmaps[state];
  const educationSteps = stateData.education_paths[education];


  if (!educationSteps) {
    roadmapDiv.innerText = lang === "hi" 
      ? "चयनित शिक्षा स्तर के लिए रोडमैप उपलब्ध नहीं है।" 
      : "Roadmap not available for selected education level.";
    return;
  }

  const steps = [...educationSteps, ...stateData.final_steps];

  const icons = {
    education: "🎓",
    law_degree: "⚖️",
    exam: "📝",
    selection: "🏛",
    appointment: "👩‍⚖️"
  };

  steps.forEach((step, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <span>${icons[step.type] || "📌"}</span>
      <strong>${lang === "hi" ? "स्टेप" : "Step"} ${index + 1}:</strong> ${step.step}
    `;
    roadmapDiv.appendChild(card);
  });
}

// =====================
// Event: Generate roadmap
// =====================
document.getElementById("loadBtn").addEventListener("click", () => {
  const state = document.getElementById("stateSelect").value;
  const education = document.getElementById("educationSelect").value;

  if (!state || !education) {
    document.getElementById("roadmap").innerText =
      lang === "hi"
        ? "कृपया राज्य और शिक्षा स्तर चुनें।"
        : "Please select both state and education level.";
    return;
  }

  renderRoadmap(state, education);
});


// =====================
// Event: Language toggle
// =====================
document.getElementById("langToggle").addEventListener("click", async () => {
  lang = lang === "en" ? "hi" : "en";
  localStorage.setItem("lang", lang);

  await loadLanguage();
  await loadRoadmap();

  // Re-render roadmap if selections already made
  const state = document.getElementById("stateSelect").value;
  const education = document.getElementById("educationSelect").value;
  if (state && education) renderRoadmap(state, education);
});

// =====================
// Initial load
// =====================
(async function init() {
  await loadLanguage();
  await loadRoadmap();
})();