let db;

// Open IndexedDB
const request = indexedDB.open("UserDB", 4);

request.onupgradeneeded = function (e) {
  db = e.target.result;

  // Users store
  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "email" });
  }

  // Judge scores store (REQUIRED by judge.js)
  if (!db.objectStoreNames.contains("judgeScores")) {
    db.createObjectStore("judgeScores", {
      keyPath: "id",
      autoIncrement: true,
    });
  }
};

request.onsuccess = function (e) {
  db = e.target.result;
};

// Switch forms
function showRegister() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}

function showLogin() {
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}

// REGISTER
document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const user = {
      username: regUsername.value,
      email: regEmail.value,
      password: regPassword.value,
      education: regEducation.value,
      language: regLanguage.value,
    };

    const tx = db.transaction("users", "readwrite");
    const store = tx.objectStore("users");

    const check = store.get(user.email);

    check.onsuccess = function () {
      if (check.result) {
        alert("User already exists");
      } else {
        store.add(user);
        alert("Registered successfully");
        showLogin();
      }
    };
  });

// LOGIN
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = loginEmail.value;
  const password = loginPassword.value;

  const tx = db.transaction("users", "readonly");
  const store = tx.objectStore("users");
  const req = store.get(email);

  req.onsuccess = function () {
    const user = req.result;

    if (!user) {
      alert("User not found");
    } else if (user.password !== password) {
      alert("Incorrect password");
    } else {
      // ✅ SAVE LOGGED-IN USER EMAIL
      localStorage.setItem("loggedInEmail", user.email);

      alert("Login successful!");

      // optional but recommended: go to Junior Judge page
      window.location.href = "judge.html";
    }
  };
});
