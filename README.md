# World of Anya

Personal timeline & storytelling platform untuk couple documentation.

## ✨ Features

- 📝 **Timeline Posts** - Share moments dengan foto & caption
- 📖 **Stories** - Cerita panjang dengan multiple images
- 👥 **Dual Profiles** - Her & Him perspectives
- 🎨 **Modern UI** - Beautiful gradient design
- 🔐 **Secure** - Firebase Authentication & Firestore
- 📱 **Responsive** - Works di semua devices

## 🚀 Quick Setup

```bash
# 1. Copy Firebase config
cp js/firebase-config.example.js js/firebase-config.js

# 2. Edit firebase-config.js dengan config kamu dari Firebase Console

# 3. Run local server
python3 -m http.server 8000

# 4. Open http://localhost:8000
```

**📖 Panduan lengkap ada di [SETUP.md](SETUP.md)**

## 📋 Prerequisites

- Firebase Account (gratis)
- Web Server (Python, Node, atau VS Code Live Server)
- Modern Browser (Chrome, Firefox, Safari, Edge)

## 🔑 Default Config

Edit di `js/firestore-service.js`:
```javascript
export const EMAIL_TO_AUTHOR = {
    'user1@example.com': 'rey',
    'user2@example.com': 'anya'
};
```

## 📁 Main Files

- `universe/home.html` - Main timeline
- `js/firebase-config.js` - **Your Firebase credentials (JANGAN commit!)**
- `js/firestore-service.js` - Database operations
- `SETUP.md` - Detailed setup instructions

## 🔒 Security

File `firebase-config.js` berisi sensitive data. Pastikan:
- ✅ File ada di `.gitignore`
- ✅ Jangan share ke public
- ✅ Pakai Firestore security rules di production

## 📞 Support

Ada masalah? Cek [SETUP.md](SETUP.md) untuk troubleshooting guide.

---

Made with 💙 for Anya
