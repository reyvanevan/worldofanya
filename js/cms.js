import { db, auth } from './firebase-config.js';
import { doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Utility: Image Compression ---
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Max dimensions (keep it small for Firestore < 1MB limit)
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.6 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// --- Utility: Toast Notification ---
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-msg');

    msg.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// --- CMS Logic ---

// 1. Load Initial Data
async function loadCMSData() {
    // Load Home Data
    const homeDoc = await getDoc(doc(db, "content", "home"));
    if (homeDoc.exists()) {
        const data = homeDoc.data();
        // Hero
        document.querySelector('input[name="title"]').value = data.heroTitle || '';
        document.querySelector('input[name="subtitle"]').value = data.heroSubtitle || '';
        // About
        document.querySelector('textarea[name="about1"]').value = data.aboutText1 || '';
        document.querySelector('textarea[name="about2"]').value = data.aboutText2 || '';
        if (data.aboutImage) {
            const img = document.getElementById('home-about-img-preview');
            img.src = data.aboutImage;
            img.classList.remove('hidden');
            document.getElementById('home-about-img-placeholder').classList.add('hidden');
        }
    }

    // Load Her Data
    const herDoc = await getDoc(doc(db, "content", "her"));
    if (herDoc.exists()) {
        const data = herDoc.data();
        document.querySelector('#her-profile-form input[name="quote"]').value = data.quote || '';
        if (data.profileImage) {
            const img = document.getElementById('her-profile-img-preview');
            img.src = data.profileImage;
            img.classList.remove('hidden');
            document.getElementById('her-profile-img-placeholder').classList.add('hidden');
        }
    }

    // Load Him Data
    const himDoc = await getDoc(doc(db, "content", "him"));
    if (himDoc.exists()) {
        const data = himDoc.data();
        document.querySelector('#him-profile-form input[name="quote"]').value = data.quote || '';
        if (data.profileImage) {
            const img = document.getElementById('him-profile-img-preview');
            img.src = data.profileImage;
            img.classList.remove('hidden');
            document.getElementById('him-profile-img-placeholder').classList.add('hidden');
        }
    }
}

// 2. Save Home Data
const homeHeroForm = document.getElementById('home-hero-form');
if (homeHeroForm) {
    homeHeroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = e.target.title.value;
        const subtitle = e.target.subtitle.value;

        try {
            await setDoc(doc(db, "content", "home"), {
                heroTitle: title,
                heroSubtitle: subtitle
            }, { merge: true });
            showToast('Hero section updated!');
        } catch (error) {
            console.error(error);
            showToast('Error saving data', 'error');
        }
    });
}

const homeAboutForm = document.getElementById('home-about-form');
if (homeAboutForm) {
    homeAboutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const about1 = e.target.about1.value;
        const about2 = e.target.about2.value;
        const fileInput = document.getElementById('home-about-img-input');

        let updateData = {
            aboutText1: about1,
            aboutText2: about2
        };

        if (fileInput.files[0]) {
            try {
                const base64 = await compressImage(fileInput.files[0]);
                updateData.aboutImage = base64;
                // Update preview
                document.getElementById('home-about-img-preview').src = base64;
                document.getElementById('home-about-img-preview').classList.remove('hidden');
            } catch (err) {
                console.error("Image compression failed", err);
                return;
            }
        }

        try {
            await setDoc(doc(db, "content", "home"), updateData, { merge: true });
            showToast('About section updated!');
        } catch (error) {
            console.error(error);
            showToast('Error saving data', 'error');
        }
    });
}

// 3. Save Her Data
const herForm = document.getElementById('her-profile-form');
if (herForm) {
    herForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const quote = e.target.quote.value;
        const fileInput = document.getElementById('her-profile-img-input');

        let updateData = { quote: quote };

        if (fileInput.files[0]) {
            try {
                const base64 = await compressImage(fileInput.files[0]);
                updateData.profileImage = base64;
                document.getElementById('her-profile-img-preview').src = base64;
                document.getElementById('her-profile-img-preview').classList.remove('hidden');
            } catch (err) {
                console.error(err);
                return;
            }
        }

        try {
            await setDoc(doc(db, "content", "her"), updateData, { merge: true });
            showToast('Her profile updated!');
        } catch (error) {
            console.error(error);
            showToast('Error saving data', 'error');
        }
    });
}

// 4. Save Him Data
const himForm = document.getElementById('him-profile-form');
if (himForm) {
    himForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const quote = e.target.quote.value;
        const fileInput = document.getElementById('him-profile-img-input');

        let updateData = { quote: quote };

        if (fileInput.files[0]) {
            try {
                const base64 = await compressImage(fileInput.files[0]);
                updateData.profileImage = base64;
                document.getElementById('him-profile-img-preview').src = base64;
                document.getElementById('him-profile-img-preview').classList.remove('hidden');
            } catch (err) {
                console.error(err);
                return;
            }
        }

        try {
            await setDoc(doc(db, "content", "him"), updateData, { merge: true });
            showToast('Him profile updated!');
        } catch (error) {
            console.error(error);
            showToast('Error saving data', 'error');
        }
    });
}

// 5. Manage Posts (Us Page)
const postForm = document.getElementById('us-post-form');
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const caption = document.getElementById('post-caption').value;
        const date = document.getElementById('post-date').value;
        const fileInput = document.getElementById('post-img-input');
        const btn = postForm.querySelector('button');

        if (!caption || !date) {
            alert("Please fill in caption and date");
            return;
        }

        btn.disabled = true;
        btn.textContent = "Posting...";

        let imageData = null;
        if (fileInput.files[0]) {
            try {
                imageData = await compressImage(fileInput.files[0]);
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                return;
            }
        }

        try {
            await addDoc(collection(db, "posts"), {
                caption: caption,
                date: date,
                image: imageData, // Can be null if text only
                timestamp: serverTimestamp()
            });
            showToast('New memory added!');
            postForm.reset();
        } catch (error) {
            console.error(error);
            showToast('Error posting', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = "Post Memory";
        }
    });
}

// 6. Real-time Posts Listener
const postsContainer = document.getElementById('posts-container');
if (postsContainer) {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        postsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const post = doc.data();
            const div = document.createElement('div');
            div.className = "glass-panel p-4 rounded-xl flex gap-4 items-start";

            let imgHtml = '';
            if (post.image) {
                imgHtml = `<div class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100"><img src="${post.image}" class="w-full h-full object-cover"></div>`;
            }

            div.innerHTML = `
                ${imgHtml}
                <div class="flex-1">
                    <p class="text-xs text-slate-400 mb-1">${post.date}</p>
                    <p class="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">${post.caption}</p>
                </div>
                <button onclick="window.deletePost('${doc.id}')" class="text-red-400 hover:text-red-600 p-2">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
            postsContainer.appendChild(div);
        });
        lucide.createIcons();
    });
}

// Expose delete function globally
window.deletePost = async (id) => {
    if (confirm("Are you sure you want to delete this memory?")) {
        try {
            await deleteDoc(doc(db, "posts", id));
            showToast('Memory deleted');
        } catch (error) {
            console.error(error);
        }
    }
};

// Initialize
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('user-email').textContent = user.email;
        loadCMSData();
    }
});
