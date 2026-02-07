let lang = localStorage.getItem("lang") || "en";
let labels = {};

async function loadLanguage() {
  const res = await fetch(`./json/lang_${lang}.json`);
  labels = await res.json();
  applyLanguage();
}

function applyLanguage() {

  // Welcome header
  const welcome = document.getElementById("welcome-header");
  if (welcome) welcome.innerText = labels.welcome;

  // Subtitle
  const subtitle = document.querySelector(".subtitle");
  if (subtitle) subtitle.innerText = labels.home_subtitle;

  // Cards
  const cards = document.querySelectorAll(".card");

  if (cards.length === 4) {
    cards[0].querySelector("h3").innerText = labels.cards.roadmap_title;
    cards[0].querySelector("p").innerText = labels.cards.roadmap_desc;

    cards[1].querySelector("h3").innerText = labels.cards.assistant_title;
    cards[1].querySelector("p").innerText = labels.cards.assistant_desc;

    cards[2].querySelector("h3").innerText = labels.cards.simulation_title;
    cards[2].querySelector("p").innerText = labels.cards.simulation_desc;

    cards[3].querySelector("h3").innerText = labels.cards.leaderboard_title;
    cards[3].querySelector("p").innerText = labels.cards.leaderboard_desc;
  }

  // Navbar
  document.querySelectorAll(".navbar a").forEach(link => {
    const key = link.getAttribute("data-i18n");
    if (key) link.innerText = labels.navbar[key];
  });

  // Toggle button text
  document.getElementById("langToggle").innerText =
    lang === "en" ? "हिंदी" : "English";
}

// Language toggle
document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "en" ? "hi" : "en";
  localStorage.setItem("lang", lang);
  loadLanguage();
});

// Init
loadLanguage();
