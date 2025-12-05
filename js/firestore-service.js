/**
 * Firestore Service - World of Anya
 * Handles all database operations for posts, stories, and user data
 * Uses Base64 encoding for images (no Firebase Storage needed!)
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

// ==================== CONSTANTS ====================

// Email to author mapping
export const EMAIL_TO_AUTHOR = {
    'reyvan@ganteng.com': 'rey',
    'sayang@anya.com': 'anya'
};

// User profiles - sesuai UI yang ada
export const USER_PROFILES = {
    rey: {
        id: 'rey',
        name: 'M Reyvan Purnama',
        displayName: 'Rey',
        email: 'reyvan@ganteng.com',
        role: 'The Observer',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
        accentColor: 'blue'
    },
    anya: {
        id: 'anya',
        name: 'Anya',
        displayName: 'Anya',
        email: 'sayang@anya.com',
        role: 'The Main Character',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
        accentColor: 'pink'
    }
};

/**
 * Get current author based on logged in user email
 * @param {Object} user - Firebase Auth user object
 * @returns {string} 'rey' or 'anya'
 */
export function getCurrentAuthor(user) {
    if (!user || !user.email) return 'rey'; // default
    return EMAIL_TO_AUTHOR[user.email.toLowerCase()] || 'rey';
}

// Post types
export const POST_TYPES = {
    PHOTO: 'photo',
    NOTE: 'note',
    STORY: 'story'
};

// Tags for categorization
export const TAGS = ['Dates', 'Trips', 'Food', 'Silly', 'Random', 'Music', 'Tech', 'Work'];

// Max image size for Base64 (500KB after compression)
const MAX_IMAGE_SIZE = 500 * 1024;

// ==================== IMAGE UTILITIES ====================

/**
 * Compress and convert image to Base64
 * @param {File} file - Image file from input
 * @param {number} maxWidth - Max width in pixels (default 800)
 * @param {number} quality - JPEG quality 0-1 (default 0.7)
 * @returns {Promise<string>} Base64 encoded image
 */
export async function compressImageToBase64(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // Create canvas for compression
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize if too large
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to Base64 (JPEG for smaller size)
                let base64 = canvas.toDataURL('image/jpeg', quality);
                
                // Check size and reduce quality if needed
                while (base64.length > MAX_IMAGE_SIZE && quality > 0.3) {
                    quality -= 0.1;
                    base64 = canvas.toDataURL('image/jpeg', quality);
                }
                
                // If still too large, reduce dimensions
                if (base64.length > MAX_IMAGE_SIZE) {
                    const scale = Math.sqrt(MAX_IMAGE_SIZE / base64.length);
                    canvas.width = width * scale;
                    canvas.height = height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    base64 = canvas.toDataURL('image/jpeg', 0.6);
                }
                
                resolve(base64);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Get current user profile based on logged in user
 * Maps Firebase Auth user to our USER_PROFILES
 */
export function getCurrentUserProfile() {
    const user = auth.currentUser;
    if (!user) return null;
    
    // Map email to user profile (you can customize this logic)
    // For now: if email contains 'rey' or 'reyvan' -> rey, else -> anya
    const email = user.email?.toLowerCase() || '';
    
    if (email.includes('rey') || email.includes('reyvan')) {
        return USER_PROFILES.rey;
    }
    return USER_PROFILES.anya;
}

// ==================== POST OPERATIONS ====================

/**
 * Create a new post (photo or note)
 * @param {Object} postData - Post data
 * @param {string} postData.type - 'photo' or 'note'
 * @param {string} postData.caption - Text caption
 * @param {string} postData.imageBase64 - Base64 image (for photo type)
 * @param {string} postData.location - Location string
 * @param {string[]} postData.tags - Array of tags
 * @param {string} postData.authorId - 'rey' or 'anya'
 * @returns {Promise<string>} Document ID of created post
 */
export async function createPost(postData) {
    const { type, caption, imageBase64, location, tags, authorId } = postData;
    
    const author = USER_PROFILES[authorId] || getCurrentUserProfile();
    if (!author) throw new Error('User not authenticated');
    
    const post = {
        type: type || POST_TYPES.PHOTO,
        caption: caption || '',
        imageBase64: imageBase64 || null,
        location: location || '',
        tags: tags || [],
        authorId: author.id,
        authorName: author.name,
        authorDisplayName: author.displayName,
        authorAvatar: author.avatarUrl,
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'posts'), post);
    return docRef.id;
}

/**
 * Get all posts, ordered by newest first
 * @param {number} limitCount - Max number of posts to fetch
 * @param {string} authorId - Optional filter by author ('rey' or 'anya')
 * @returns {Promise<Array>} Array of posts
 */
export async function getPosts(limitCount = 20, authorId = null) {
    let q;
    
    if (authorId) {
        q = query(
            collection(db, 'posts'),
            where('authorId', '==', authorId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
    } else {
        q = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JS Date
        createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
}

/**
 * Get posts by tag
 * @param {string} tag - Tag to filter by
 * @param {number} limitCount - Max number of posts
 */
export async function getPostsByTag(tag, limitCount = 20) {
    const q = query(
        collection(db, 'posts'),
        where('tags', 'array-contains', tag),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
}

/**
 * Delete a post
 * @param {string} postId - Document ID
 */
export async function deletePost(postId) {
    await deleteDoc(doc(db, 'posts', postId));
}

/**
 * Like/unlike a post (toggle)
 * @param {string} postId - Document ID
 * @param {number} currentLikes - Current like count
 */
export async function toggleLike(postId, currentLikes) {
    // Simple increment for now (in production, track who liked)
    await updateDoc(doc(db, 'posts', postId), {
        likes: currentLikes + 1
    });
}

// ==================== STORY OPERATIONS ====================

/**
 * Create a new story (expires after 24h conceptually, but we keep them)
 * @param {Object} storyData - Story data
 */
export async function createStory(storyData) {
    const { imageBase64, caption, authorId } = storyData;
    
    const author = USER_PROFILES[authorId] || getCurrentUserProfile();
    if (!author) throw new Error('User not authenticated');
    
    const story = {
        type: POST_TYPES.STORY,
        imageBase64: imageBase64,
        caption: caption || '',
        authorId: author.id,
        authorName: author.name,
        authorDisplayName: author.displayName,
        authorAvatar: author.avatarUrl,
        createdAt: serverTimestamp(),
        // Story "expires" after 24h (we use this for UI, not deletion)
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
    };
    
    const docRef = await addDoc(collection(db, 'stories'), story);
    return docRef.id;
}

/**
 * Get active stories (created in last 24h)
 */
export async function getActiveStories() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
        collection(db, 'stories'),
        where('createdAt', '>=', Timestamp.fromDate(yesterday)),
        orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
}

/**
 * Get all stories (for highlights/archive)
 */
export async function getAllStories(limitCount = 50) {
    const q = query(
        collection(db, 'stories'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {Date} date - Date object
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

/**
 * Format date for display (e.g., "Dec 5, 2025")
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
