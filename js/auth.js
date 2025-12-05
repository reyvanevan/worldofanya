import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Handle Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-message');
        const btn = document.getElementById('login-btn');

        try {
            // Loading state
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Signing in...`;
            lucide.createIcons();

            await signInWithEmailAndPassword(auth, email, password);
            // Redirect handled by onAuthStateChanged
        } catch (error) {
            console.error("Login Error:", error);
            errorMsg.textContent = "Invalid email or password.";
            errorMsg.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = `<span>Sign In</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
            lucide.createIcons();
        }
    });
}

// Handle Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // Redirect handled by onAuthStateChanged
        } catch (error) {
            console.error("Logout Error:", error);
        }
    });
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html');
    const isAdminPage = path.includes('admin.html');

    if (user) {
        console.log("User is logged in:", user.email);
        if (isLoginPage) {
            window.location.href = 'admin.html';
        }
    } else {
        console.log("User is logged out");
        if (isAdminPage) {
            window.location.href = 'login.html';
        }
    }
});
