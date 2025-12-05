import { db } from './firebase-config.js';
import { doc, getDoc, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Data Loader: Fetch and render content from Firestore ---

// Load Home Page Data
async function loadHomeData() {
    try {
        const docSnap = await getDoc(doc(db, "content", "home"));
        if (docSnap.exists()) {
            const data = docSnap.data();

            // Hero Section
            const heroTitle = document.getElementById('hero-title');
            const heroSubtitle = document.getElementById('hero-subtitle');
            if (heroTitle && data.heroTitle) heroTitle.textContent = data.heroTitle;
            if (heroSubtitle && data.heroSubtitle) heroSubtitle.textContent = data.heroSubtitle;

            // About Section
            const aboutText1 = document.getElementById('about-text-1');
            const aboutText2 = document.getElementById('about-text-2');
            const aboutImage = document.getElementById('about-image');

            if (aboutText1 && data.aboutText1) aboutText1.innerHTML = data.aboutText1;
            if (aboutText2 && data.aboutText2) aboutText2.innerHTML = data.aboutText2;
            if (aboutImage && data.aboutImage) aboutImage.src = data.aboutImage;
        }
    } catch (error) {
        console.error("Error loading home data:", error);
    }
}

// Load Her Page Data
async function loadHerData() {
    try {
        const docSnap = await getDoc(doc(db, "content", "her"));
        if (docSnap.exists()) {
            const data = docSnap.data();

            const quote = document.getElementById('her-quote');
            const profileImg = document.getElementById('her-profile-image');

            if (quote && data.quote) quote.textContent = `"${data.quote}"`;
            if (profileImg && data.profileImage) profileImg.src = data.profileImage;
        }
    } catch (error) {
        console.error("Error loading her data:", error);
    }
}

// Load Him Page Data
async function loadHimData() {
    try {
        const docSnap = await getDoc(doc(db, "content", "him"));
        if (docSnap.exists()) {
            const data = docSnap.data();

            const quote = document.getElementById('him-quote');
            const profileImg = document.getElementById('him-profile-image');

            if (quote && data.quote) quote.textContent = `"${data.quote}"`;
            if (profileImg && data.profileImage) profileImg.src = data.profileImage;
        }
    } catch (error) {
        console.error("Error loading him data:", error);
    }
}

// Load Us Page Posts
async function loadUsPosts() {
    try {
        const postsContainer = document.getElementById('timeline-posts');
        if (!postsContainer) return;

        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            postsContainer.innerHTML = `
                <div class="text-center py-10 text-slate-400">
                    <p>No memories yet... 💭</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const post = doc.data();
            const article = createPostElement(post);
            postsContainer.appendChild(article);
        });

        // Re-initialize Lucide icons for dynamically added content
        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

// Helper: Create Post Element
function createPostElement(post) {
    const article = document.createElement('article');
    article.className = "glass-card rounded-3xl overflow-hidden hover:shadow-xl transition-shadow duration-300";
    article.setAttribute('data-aos', 'fade-up');

    let imageHtml = '';
    if (post.image) {
        imageHtml = `
            <div class="relative aspect-[4/5] bg-slate-100 dark:bg-slate-800 overflow-hidden group">
                <img src="${post.image}" alt="Memory" class="w-full h-full object-cover transition duration-700 group-hover:scale-105">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/10">
                    <i data-lucide="heart" class="w-16 h-16 text-white fill-white drop-shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300 delay-100"></i>
                </div>
            </div>
        `;
    }

    article.innerHTML = `
        <div class="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 p-[2px]">
                    <div class="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=Us&background=random" alt="Us" class="w-full h-full object-cover">
                    </div>
                </div>
                <div>
                    <h3 class="font-bold text-sm text-slate-800 dark:text-white">Rey & Anya</h3>
                    <p class="text-[10px] text-slate-400 uppercase tracking-wide">${post.date || 'A moment'}</p>
                </div>
            </div>
        </div>
        
        ${imageHtml}
        
        <div class="p-4">
            <div class="flex items-center gap-4 mb-3">
                <button class="hover:scale-110 transition-transform"><i data-lucide="heart" class="w-6 h-6 text-brand-accent fill-brand-accent"></i></button>
                <button class="hover:scale-110 transition-transform"><i data-lucide="message-circle" class="w-6 h-6 text-slate-600 dark:text-slate-300"></i></button>
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <span class="font-bold text-slate-800 dark:text-white mr-1">Rey & Anya</span>
                ${post.caption || ''}
            </div>
            <p class="text-[10px] text-slate-400 mt-3 uppercase tracking-widest">${post.date || ''}</p>
        </div>
    `;

    return article;
}

// Auto-detect page and load appropriate data
function init() {
    const path = window.location.pathname;

    if (path.includes('index.html') || path.endsWith('/')) {
        loadHomeData();
    } else if (path.includes('her.html')) {
        loadHerData();
    } else if (path.includes('him.html')) {
        loadHimData();
    } else if (path.includes('us.html')) {
        loadUsPosts();
    }
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { loadHomeData, loadHerData, loadHimData, loadUsPosts };
