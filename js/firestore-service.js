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
    getDoc,
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

// User profiles - dynamically updated from Firestore
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
 * Load user avatars from Firestore profiles
 * Updates USER_PROFILES with latest photos from profileRey and profileHer
 */
export async function loadUserAvatarsFromFirestore() {
    try {
        const [reyDoc, herDoc] = await Promise.all([
            getDoc(doc(db, 'landing', 'profileRey')),
            getDoc(doc(db, 'landing', 'profileHer'))
        ]);
        
        if (reyDoc.exists() && reyDoc.data().photo) {
            USER_PROFILES.rey.avatarUrl = reyDoc.data().photo;
            USER_PROFILES.rey.name = reyDoc.data().name || USER_PROFILES.rey.name;
            USER_PROFILES.rey.displayName = reyDoc.data().name || USER_PROFILES.rey.displayName;
        }
        
        if (herDoc.exists() && herDoc.data().photo) {
            USER_PROFILES.anya.avatarUrl = herDoc.data().photo;
            USER_PROFILES.anya.name = herDoc.data().name || USER_PROFILES.anya.name;
            USER_PROFILES.anya.displayName = herDoc.data().name || USER_PROFILES.anya.displayName;
        }
        
        console.log('[FirestoreService] User avatars loaded from Firestore');
        return USER_PROFILES;
    } catch (error) {
        console.warn('[FirestoreService] Could not load avatars from Firestore:', error);
        return USER_PROFILES;
    }
}

/**
 * Get fresh avatar URL for an author
 * Always returns the latest from USER_PROFILES (after loadUserAvatarsFromFirestore)
 * @param {string} authorId - 'rey' or 'anya'
 * @returns {string} Avatar URL
 */
export function getAuthorAvatar(authorId) {
    return USER_PROFILES[authorId]?.avatarUrl || USER_PROFILES.rey.avatarUrl;
}

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

// Available icons for highlights (Lucide icon names)
export const HIGHLIGHT_ICONS = [
    'heart', 'star', 'camera', 'music', 'plane', 'coffee', 'smile', 'sun',
    'moon', 'sparkles', 'flame', 'zap', 'gift', 'cake', 'crown', 'diamond',
    'gamepad-2', 'headphones', 'briefcase', 'book', 'palette', 'film',
    'utensils', 'shopping-bag', 'home', 'car', 'bike', 'dumbbell'
];

// Available gradient colors for highlights
export const HIGHLIGHT_GRADIENTS = [
    { id: 'pink', from: 'pink-400', to: 'rose-500' },
    { id: 'purple', from: 'purple-400', to: 'pink-500' },
    { id: 'blue', from: 'blue-400', to: 'cyan-500' },
    { id: 'green', from: 'emerald-400', to: 'teal-500' },
    { id: 'orange', from: 'orange-400', to: 'amber-500' },
    { id: 'red', from: 'red-400', to: 'rose-600' },
    { id: 'slate', from: 'slate-400', to: 'slate-600' },
    { id: 'gold', from: 'yellow-400', to: 'amber-500' }
];

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

/**
 * Get archived stories for a specific author (older than 24h)
 * @param {string} authorId - 'rey' or 'anya'
 * @param {number} limitCount - Max number of stories
 * @returns {Promise<Array>} Array of archived stories grouped by month
 */
export async function getArchivedStories(authorId, limitCount = 100) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
        collection(db, 'stories'),
        where('authorId', '==', authorId),
        where('createdAt', '<', Timestamp.fromDate(yesterday)),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const stories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    
    return stories;
}

/**
 * Group stories by month for archive display
 * @param {Array} stories - Array of story objects
 * @returns {Object} Stories grouped by month key (e.g., "December 2025")
 */
export function groupStoriesByMonth(stories) {
    const grouped = {};
    
    stories.forEach(story => {
        const date = story.createdAt;
        const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(story);
    });
    
    return grouped;
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

// ==================== HIGHLIGHT OPERATIONS ====================

/**
 * Create a new highlight
 * @param {Object} highlightData - Highlight data
 * @returns {Promise<string>} Document ID
 */
export async function createHighlight(highlightData) {
    const { name, icon, gradient, authorId, coverImageBase64 } = highlightData;
    
    const highlight = {
        name: name.trim(),
        icon: icon || 'star',
        gradient: gradient || 'pink',
        authorId: authorId,
        coverImageBase64: coverImageBase64 || null, // First story image as cover
        storyIds: [], // Array of story document IDs
        storyCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'highlights'), highlight);
    return docRef.id;
}

/**
 * Get highlights for a specific user
 * @param {string} authorId - 'rey' or 'anya'
 * @returns {Promise<Array>} Array of highlights
 */
export async function getHighlights(authorId) {
    const q = query(
        collection(db, 'highlights'),
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
}

/**
 * Get a single highlight by ID
 * @param {string} highlightId - Document ID
 * @returns {Promise<Object>} Highlight data
 */
export async function getHighlightById(highlightId) {
    const docRef = doc(db, 'highlights', highlightId);
    const docSnap = await getDocs(query(collection(db, 'highlights'), where('__name__', '==', highlightId)));
    
    if (docSnap.empty) return null;
    
    const data = docSnap.docs[0].data();
    return {
        id: docSnap.docs[0].id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
    };
}

/**
 * Add story to a highlight
 * @param {string} highlightId - Highlight document ID
 * @param {string} storyId - Story document ID
 * @param {string} storyImageBase64 - Story image for cover (optional, uses first if not set)
 */
export async function addStoryToHighlight(highlightId, storyId, storyImageBase64 = null) {
    const highlightRef = doc(db, 'highlights', highlightId);
    
    // Get current highlight data
    const q = query(collection(db, 'highlights'), where('__name__', '==', highlightId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error('Highlight not found');
    
    const currentData = snapshot.docs[0].data();
    const currentStoryIds = currentData.storyIds || [];
    
    // Don't add duplicate
    if (currentStoryIds.includes(storyId)) return;
    
    const updateData = {
        storyIds: [...currentStoryIds, storyId],
        storyCount: currentStoryIds.length + 1,
        updatedAt: serverTimestamp()
    };
    
    // Set cover image if this is the first story or no cover yet
    if (!currentData.coverImageBase64 && storyImageBase64) {
        updateData.coverImageBase64 = storyImageBase64;
    }
    
    await updateDoc(highlightRef, updateData);
}

/**
 * Remove story from a highlight
 * @param {string} highlightId - Highlight document ID
 * @param {string} storyId - Story document ID
 */
export async function removeStoryFromHighlight(highlightId, storyId) {
    const highlightRef = doc(db, 'highlights', highlightId);
    
    const q = query(collection(db, 'highlights'), where('__name__', '==', highlightId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error('Highlight not found');
    
    const currentData = snapshot.docs[0].data();
    const currentStoryIds = currentData.storyIds || [];
    const newStoryIds = currentStoryIds.filter(id => id !== storyId);
    
    await updateDoc(highlightRef, {
        storyIds: newStoryIds,
        storyCount: newStoryIds.length,
        updatedAt: serverTimestamp()
    });
}

/**
 * Update highlight details
 * @param {string} highlightId - Document ID
 * @param {Object} updates - Fields to update
 */
export async function updateHighlight(highlightId, updates) {
    const highlightRef = doc(db, 'highlights', highlightId);
    await updateDoc(highlightRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete a highlight
 * @param {string} highlightId - Document ID
 */
export async function deleteHighlight(highlightId) {
    await deleteDoc(doc(db, 'highlights', highlightId));
}

/**
 * Get stories for a highlight
 * @param {string} highlightId - Highlight document ID
 * @returns {Promise<Array>} Array of stories in the highlight
 */
export async function getHighlightStories(highlightId) {
    // First get the highlight to get story IDs
    const q = query(collection(db, 'highlights'), where('__name__', '==', highlightId));
    const highlightSnap = await getDocs(q);
    
    if (highlightSnap.empty) return [];
    
    const storyIds = highlightSnap.docs[0].data().storyIds || [];
    
    if (storyIds.length === 0) return [];
    
    // Fetch all stories by IDs
    const stories = [];
    for (const storyId of storyIds) {
        const storyQ = query(collection(db, 'stories'), where('__name__', '==', storyId));
        const storySnap = await getDocs(storyQ);
        
        if (!storySnap.empty) {
            const data = storySnap.docs[0].data();
            stories.push({
                id: storySnap.docs[0].id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
            });
        }
    }
    
    // Sort by createdAt desc
    return stories.sort((a, b) => b.createdAt - a.createdAt);
}

// ==================== LOVE PROGRESS ====================

/**
 * Milestone messages based on progress percentage
 */
export const LOVE_MILESTONES = {
    0: { emoji: '💔', message: 'Starting from zero...', color: 'slate' },
    10: { emoji: '🌱', message: 'A small seed of hope', color: 'slate' },
    20: { emoji: '💙', message: 'Dia bilang 20%... dan itu sudah bikin aku senyum seharian.', color: 'blue' },
    30: { emoji: '🌸', message: 'Perlahan tapi pasti...', color: 'blue' },
    40: { emoji: '💜', message: 'Getting closer each day', color: 'purple' },
    50: { emoji: '💗', message: 'Halfway there! Keep going...', color: 'pink' },
    60: { emoji: '💕', message: 'More than friends now?', color: 'pink' },
    70: { emoji: '💖', message: 'Almost there... I can feel it', color: 'pink' },
    80: { emoji: '💝', message: 'So close to home...', color: 'rose' },
    90: { emoji: '💘', message: 'Just a little more...', color: 'rose' },
    100: { emoji: '❤️', message: 'Welcome back, my love. Aku pulang.', color: 'red' }
};

/**
 * Get milestone for current progress
 */
export function getMilestone(progress) {
    const milestones = Object.keys(LOVE_MILESTONES).map(Number).sort((a, b) => b - a);
    for (const threshold of milestones) {
        if (progress >= threshold) {
            return LOVE_MILESTONES[threshold];
        }
    }
    return LOVE_MILESTONES[0];
}

/**
 * Get milestone message based on progress value
 * @param {number} progress - Progress value 0-100
 * @returns {Object} { emoji, message, color }
 */
export function getMilestoneMessage(progress) {
    if (progress === 0) return { emoji: '🖤', message: 'Belum mulai...', color: 'slate' };
    if (progress < 20) return { emoji: '🌱', message: 'Baru mulai tumbuh kembali...', color: 'emerald' };
    if (progress < 40) return { emoji: '🌸', message: 'Ada sesuatu yang mulai kembali...', color: 'pink' };
    if (progress < 60) return { emoji: '💛', message: 'Setengah jalan pulang...', color: 'yellow' };
    if (progress < 80) return { emoji: '🧡', message: 'Semakin dekat...', color: 'orange' };
    if (progress < 100) return { emoji: '💗', message: 'Hampir sampai...', color: 'rose' };
    return { emoji: '💕', message: "I'm home. Welcome back, my love.", color: 'pink' };
}

/**
 * Get love progress from Firestore
 */
export async function getLoveProgress() {
    try {
        const docRef = doc(db, 'landing', 'loveProgress');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                currentProgress: data.currentProgress || 0,
                lastUpdate: data.lastUpdate?.toDate() || null,
                lastUpdatedBy: data.lastUpdatedBy || 'anya',
                history: (data.history || []).map(h => ({
                    ...h,
                    date: h.date?.toDate() || new Date()
                })),
                visitorCount: data.visitorCount || 0
            };
        }
        
        return {
            currentProgress: 0,
            lastUpdate: null,
            lastUpdatedBy: 'anya',
            history: [],
            visitorCount: 0
        };
    } catch (error) {
        console.error('Error getting love progress:', error);
        throw error;
    }
}

/**
 * Update love progress (only Princess can update)
 */
export async function updateLoveProgress(newProgress, note = '') {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Must be logged in');
        
        const author = getCurrentAuthor(user);
        if (author !== 'anya') throw new Error('Only Princess can update this');
        
        const docRef = doc(db, 'landing', 'loveProgress');
        const docSnap = await getDoc(docRef);
        
        const currentData = docSnap.exists() ? docSnap.data() : { history: [], visitorCount: 0 };
        const history = currentData.history || [];
        
        // Add to history
        history.push({
            date: serverTimestamp(),
            value: newProgress,
            note: note || getMilestone(newProgress).message
        });
        
        await updateDoc(docRef, {
            currentProgress: newProgress,
            lastUpdate: serverTimestamp(),
            lastUpdatedBy: 'anya',
            history: history
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error updating love progress:', error);
        throw error;
    }
}

/**
 * Increment visitor count
 */
export async function incrementVisitorCount() {
    try {
        const docRef = doc(db, 'landing', 'loveProgress');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const currentCount = docSnap.data().visitorCount || 0;
            await updateDoc(docRef, {
                visitorCount: currentCount + 1
            });
            return currentCount + 1;
        } else {
            // Initialize document if doesn't exist
            const { setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
            await setDoc(docRef, {
                currentProgress: 0,
                lastUpdate: serverTimestamp(),
                lastUpdatedBy: 'system',
                history: [],
                visitorCount: 1
            });
            return 1;
        }
    } catch (error) {
        console.error('Error incrementing visitor count:', error);
        return 0;
    }
}
