# World of Anya - Setup Guide

Panduan setup project untuk developer baru.

## 🚀 Quick Start

### 1. Clone/Download Project
```bash
git clone <repository-url>
cd worldofanya
```

### 2. Setup Firebase

#### A. Buat Firebase Project
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Add project"** atau **"Create a project"**
3. Masukkan nama project (contoh: `my-worldofanya`)
4. Enable/disable Google Analytics (optional)
5. Klik **"Create project"**

#### B. Setup Firestore Database
1. Di Firebase Console, buka **Firestore Database**
2. Klik **"Create database"**
3. Pilih **"Start in test mode"** (untuk development)
4. Pilih lokasi server (pilih yang terdekat, contoh: `asia-southeast1`)
5. Klik **"Enable"**

#### C. Setup Authentication
1. Di Firebase Console, buka **Authentication**
2. Klik **"Get started"**
3. Pilih tab **"Sign-in method"**
4. Enable **"Email/Password"**
5. Klik **"Save"**

#### D. Buat User Accounts
1. Di Authentication → **Users** tab
2. Klik **"Add user"**
3. Buat 2 user:
   - Email: `reyvan@ganteng.com` (atau email custom kamu)
   - Email: `sayang@anya.com` (atau email custom kamu)
4. Set password untuk masing-masing

### 3. Setup Firebase Config

#### A. Dapatkan Firebase Config
1. Di Firebase Console, klik **⚙️ (Settings)** → **Project settings**
2. Scroll ke bawah ke bagian **"Your apps"**
3. Klik icon **</>** (Web)
4. Register app dengan nama (contoh: `worldofanya-web`)
5. Copy kode **firebaseConfig** object

#### B. Setup File Config
```bash
# Copy file example
cp js/firebase-config.example.js js/firebase-config.js
```

Buka `js/firebase-config.js` dan ganti dengan config kamu:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
    measurementId: "G-XXXXXXXXX"
};
```

### 4. Setup Firestore Service (Custom Data)

Edit `js/firestore-service.js` - ganti email mapping sesuai user kamu:

```javascript
export const EMAIL_TO_AUTHOR = {
    'reyvan@ganteng.com': 'rey',      // Ganti dengan email user 1 kamu
    'sayang@anya.com': 'anya'         // Ganti dengan email user 2 kamu
};
```

Optional: Ganti user profiles juga (nama, avatar, dll):
```javascript
export const USER_PROFILES = {
    rey: {
        name: 'Nama Kamu',
        email: 'email-kamu@domain.com',
        // ... dst
    },
    anya: {
        name: 'Nama Pasangan',
        email: 'email-pasangan@domain.com',
        // ... dst
    }
};
```

### 5. Run Project

**⚠️ PENTING:** Jangan buka file HTML langsung! Harus pakai web server.

**Pilihan 1: Python (Recommended)**
```bash
python3 -m http.server 8000
```
Buka: http://localhost:8000

**Pilihan 2: Node.js**
```bash
npx http-server -p 8000
```

**Pilihan 3: VS Code Live Server**
- Install extension "Live Server"
- Right-click `index.html` → "Open with Live Server"

### 6. First Login
1. Buka http://localhost:8000
2. Login dengan salah satu user yang kamu buat tadi
3. Mulai posting! 🎉

## 📁 File Structure

```
worldofanya/
├── index.html              # Landing page
├── universe/
│   ├── home.html          # Main timeline
│   ├── explore.html       # Explore posts
│   ├── her.html           # Her profile
│   ├── him.html           # His profile
│   └── upload.html        # Upload post
├── js/
│   ├── firebase-config.example.js  # Template config (DON'T EDIT!)
│   ├── firebase-config.js          # Your actual config (EDIT THIS!)
│   └── firestore-service.js        # Database service
└── css/
    └── style.css
```

## 🔒 Security

### Firestore Rules (Production)
Setelah testing, ganti Firestore rules untuk security:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
    
    // Stories collection
    match /stories/{storyId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
  }
}
```

## ⚠️ IMPORTANT: `.gitignore`

**JANGAN COMMIT `firebase-config.js` KE GIT!**

Buat file `.gitignore`:
```
js/firebase-config.js
node_modules/
.DS_Store
```

## 🆘 Troubleshooting

### CORS Error / Module not allowed
- ❌ Jangan buka file:/// langsung
- ✅ Harus pakai web server (lihat step 5)

### Login tidak bisa
- Cek email/password di Firebase Console → Authentication
- Pastikan Email/Password authentication sudah enabled
- Cek console browser untuk error

### Post tidak muncul
- Cek Firestore Database apakah ada collection `posts`
- Cek `EMAIL_TO_AUTHOR` mapping sesuai dengan email user kamu
- Cek console browser untuk error

### Firebase config error
- Pastikan semua field di `firebase-config.js` sudah diisi dengan benar
- Jangan ada `YOUR_API_KEY` atau placeholder lainnya

## 📞 Need Help?

Contact original developer atau cek Firebase docs:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Get Started](https://firebase.google.com/docs/firestore/quickstart)

---

Happy coding! 💙💗
