// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBA-uEZEHmqmzbkHTun7x0vFdtqQOVY718",
  authDomain: "tejal-818e5.firebaseapp.com",
  projectId: "tejal-818e5",
  storageBucket: "tejal-818e5.firebasestorage.app",
  messagingSenderId: "279100767488",
  appId: "1:279100767488:web:ece2a0b28a7c9c0c6347e5"
};

const app = initializeApp(firebaseConfig);

// ✅ EXPORT — do NOT attach to window
export const firebaseDB = getFirestore(app);
