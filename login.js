let db;

// 1. Open IndexedDB (Increased version to 2 to force an update)
const request = indexedDB.open("UserDB", 4);

request.onupgradeneeded = function (e) {
  db = e.target.result;
  console.log("Upgrading/Creating Database...");

  // If the store doesn't exist, create it
  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "email" });
  }
};

request.onsuccess = function (e) {
  db = e.target.result;
  console.log("Database connection successful");
};

// This fires if another tab has the DB open and is blocking the upgrade
request.onblocked = function () {
  alert("Please close all other tabs of this site and refresh!");
};

request.onerror = function (e) {
  console.error("IndexedDB error:", e.target.error);
  alert("Database Error: " + e.target.error.message);
};

// --- UI Switch Functions ---
function showRegister() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}

function showLogin() {
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}

// --- REGISTER ---
document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    if (!db) {
      alert("Database is not ready yet.");
      return;
    }

    if (!document.getElementById("regState").value) {
      alert("Please select your state");
      return;
    }

    const user = {
      username: document.getElementById("regUsername").value,
      email: document.getElementById("regEmail").value,
      password: document.getElementById("regPassword").value,
      education: document.getElementById("regEducation").value,
      state: document.getElementById("regState").value,
      language: document.getElementById("regLanguage").value,
    };

    const tx = db.transaction("users", "readwrite");
    const store = tx.objectStore("users");

    // Use 'add' to ensure we don't overwrite accidentally
    const addRequest = store.add(user);

    addRequest.onsuccess = function () {
      alert("Registered successfully!");
      showLogin();
    };

    addRequest.onerror = function () {
      alert("Registration failed. Email might already exist.");
    };
  });

// --- LOGIN ---
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  if (!db) {
    alert("Database is not ready yet.");
    return;
  }

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const tx = db.transaction("users", "readonly");
  const store = tx.objectStore("users");
  const getRequest = store.get(email);

  getRequest.onsuccess = function () {
    const user = getRequest.result;

    if (!user) {
      alert("User not found. Please register first.");
    } else if (user.password !== password) {
      alert("Incorrect password!");
    } else {
      localStorage.setItem("loggedInEmail", user.email);
      alert("Login successful!");
      window.location.href = "home.html";
    }
  };

  getRequest.onerror = function () {
    alert("Error searching for user.");
  };
});
