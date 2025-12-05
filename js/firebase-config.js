import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAZgIedVYK38fyomVGOgg5Sr9biCsZkkCg",
    authDomain: "zalfauniverse-50531.firebaseapp.com",
    projectId: "zalfauniverse-50531",
    storageBucket: "zalfauniverse-50531.firebasestorage.app",
    messagingSenderId: "187990396550",
    appId: "1:187990396550:web:366c9d53b2b2e55d3d8b07",
    measurementId: "G-V9HS9DNLZR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { analytics, app, auth, db };

