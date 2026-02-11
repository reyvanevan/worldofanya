#!/bin/bash

# Script untuk menghapus firebase-config.js dari Git history
# WARNING: Ini akan REWRITE semua commit history!
# BACKUP dulu sebelum jalankan!

echo "⚠️  WARNING: This will rewrite Git history!"
echo "⚠️  Make sure you have a backup!"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🔥 Removing js/firebase-config.js from ALL commits..."

# Method 1: Using git filter-branch (older but reliable)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch js/firebase-config.js' \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "🧹 Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Done! File removed from history."
echo ""
echo "📤 Next steps:"
echo "1. Verify dengan: git log --all --full-history -- js/firebase-config.js"
echo "   (should show nothing)"
echo ""
echo "2. Force push ke remote:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "⚠️  WARNING untuk collaborators:"
echo "   Semua orang harus re-clone repository!"
echo "   JANGAN git pull, harus git clone ulang!"
