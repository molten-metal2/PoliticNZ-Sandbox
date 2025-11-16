/**
 * Profile Page Coordinator
 * Manages profile page initialization and coordinates between view and form modules
 */

// Check if user is authenticated
requireAuth();

// Get URL parameters and initialize viewedUserId
ProfileView.viewedUserId = getUrlParam('user_id');

// Initialize page
initializePage();

async function initializePage() {
  // Load profile data and display
  await loadProfile();
  
  // Initialize form handlers after profile is loaded
  initProfileForm();
}

// Wrapper for saveEdit that reloads user posts on success
// This bridges the generic saveEdit in post-utils.js with profile-specific reload
window.saveEditPost = async function(postId) {
  await saveEdit(postId, loadUserPosts);
};
