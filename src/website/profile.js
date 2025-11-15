// Profile view and edit functionality

// Check if user is authenticated
if (!auth.isAuthenticated()) {
  window.location.href = 'index.html';
}

// Store original profile data for cancel functionality
let originalProfile = null;
let isEditMode = false;
let currentUserId = null;

// Load profile on page load
loadProfile();
loadUserPosts();

async function loadProfile() {
  const loading = document.getElementById('loading');
  const profileContent = document.getElementById('profile-content');
  const errorContent = document.getElementById('error-content');
  
  try {
    const profile = await getProfile();
    
    if (!profile) {
      // No profile exists, redirect to onboarding
      window.location.href = 'onboarding.html';
      return;
    }
    
    // Store original data
    originalProfile = profile;
    currentUserId = profile.user_id;
    
    // Populate form fields
    document.getElementById('display_name').value = profile.display_name || '';
    document.getElementById('bio').value = profile.bio || '';
    document.getElementById('political_alignment').value = profile.political_alignment || '';
    
    // Display read-only fields
    document.getElementById('user_id').textContent = profile.user_id || 'N/A';
    document.getElementById('created_at').textContent = formatDate(profile.created_at);
    document.getElementById('updated_at').textContent = formatDate(profile.updated_at);
    
    // Update bio counter
    updateBioCounter();
    
    // Set to view mode initially
    setViewMode();
    
    // Show profile content
    loading.style.display = 'none';
    profileContent.style.display = 'block';
    
  } catch (error) {
    console.error('Failed to load profile:', error);
    loading.style.display = 'none';
    errorContent.style.display = 'block';
  }
}

// Toggle between view and edit modes
function setViewMode() {
  isEditMode = false;
  
  // Disable form fields
  document.getElementById('display_name').disabled = true;
  document.getElementById('bio').disabled = true;
  document.getElementById('political_alignment').disabled = true;
  
  // Show/hide buttons
  document.getElementById('view-mode-buttons').style.display = 'block';
  document.getElementById('edit-mode-buttons').style.display = 'none';
  
  // Hide messages
  document.getElementById('success-message').style.display = 'none';
  document.getElementById('error-message').style.display = 'none';
}

function setEditMode() {
  isEditMode = true;
  
  // Enable form fields
  document.getElementById('display_name').disabled = false;
  document.getElementById('bio').disabled = false;
  document.getElementById('political_alignment').disabled = false;
  
  // Show/hide buttons
  document.getElementById('view-mode-buttons').style.display = 'none';
  document.getElementById('edit-mode-buttons').style.display = 'block';
  
  // Hide messages
  document.getElementById('success-message').style.display = 'none';
  document.getElementById('error-message').style.display = 'none';
}

// Handle Edit button
document.getElementById('editButton').addEventListener('click', () => {
  setEditMode();
});

// Handle form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitButton = document.getElementById('submitButton');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  
  // Hide previous messages
  successMessage.style.display = 'none';
  errorMessage.style.display = 'none';
  
  // Disable button during submission
  submitButton.disabled = true;
  submitButton.textContent = 'Updating...';
  
  try {
    // Get form values
    const displayName = document.getElementById('display_name').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const politicalAlignment = document.getElementById('political_alignment').value;
    
    // Client-side validation
    if (displayName.length < 2 || displayName.length > 20) {
      throw new Error('Display name must be between 2 and 20 characters');
    }
    
    if (bio.length > 500) {
      throw new Error('Bio must not exceed 500 characters');
    }
    
    // Check if anything changed
    const hasChanges = 
      displayName !== originalProfile.display_name ||
      bio !== originalProfile.bio ||
      politicalAlignment !== originalProfile.political_alignment;
    
    if (!hasChanges) {
      successMessage.textContent = 'No changes to save';
      successMessage.style.display = 'block';
      submitButton.disabled = false;
      submitButton.textContent = 'Update Profile';
      return;
    }
    
    // Build update data
    const updates = {
      display_name: displayName,
      bio: bio,
      political_alignment: politicalAlignment
    };
    
    // Update profile
    await updateProfile(updates);
    
    // Update original profile with new data
    originalProfile.display_name = displayName;
    originalProfile.bio = bio;
    originalProfile.political_alignment = politicalAlignment;
    originalProfile.updated_at = new Date().toISOString();
    
    // Update the updated_at display
    document.getElementById('updated_at').textContent = formatDate(originalProfile.updated_at);
    
    // Show success message
    successMessage.textContent = 'Profile updated successfully!';
    successMessage.style.display = 'block';
    
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = 'Save Changes';
    
    // Return to view mode after successful save
    setTimeout(() => {
      setViewMode();
    }, 1500);
    
  } catch (error) {
    // Show error message
    errorMessage.textContent = error.message || 'Failed to update profile. Please try again.';
    errorMessage.style.display = 'block';
    
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = 'Save Changes';
  }
});

// Handle cancel button
document.getElementById('cancelButton').addEventListener('click', () => {
  if (originalProfile) {
    // Restore original values
    document.getElementById('display_name').value = originalProfile.display_name || '';
    document.getElementById('bio').value = originalProfile.bio || '';
    document.getElementById('political_alignment').value = originalProfile.political_alignment || '';
    
    // Update bio counter
    updateBioCounter();
    
    // Return to view mode
    setViewMode();
  }
});

// Real-time character counter for bio
document.getElementById('bio').addEventListener('input', updateBioCounter);

function updateBioCounter() {
  const bio = document.getElementById('bio');
  const charCount = bio.value.length;
  const counter = document.getElementById('bio-counter');
  counter.textContent = `${charCount}/500 characters`;
}

// Format date for display in New Zealand time
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

// Load and display user's posts
async function loadUserPosts() {
  const postsSection = document.getElementById('user-posts-section');
  const postsElement = document.getElementById('user-posts');
  const loadingElement = document.getElementById('posts-loading');
  const errorElement = document.getElementById('posts-error');
  
  try {
    postsSection.style.display = 'block';
    loadingElement.style.display = 'block';
    errorElement.style.display = 'none';
    postsElement.innerHTML = '';
    
    const posts = await getUserPosts();
    
    loadingElement.style.display = 'none';
    
    if (posts.length === 0) {
      postsElement.innerHTML = '<p class="no-posts">You haven\'t posted anything yet.</p>';
      return;
    }
    
    // Display each post
    posts.forEach(post => {
      const postElement = createPostElement(post);
      postsElement.appendChild(postElement);
    });
    
  } catch (error) {
    console.error('Failed to load user posts:', error);
    loadingElement.style.display = 'none';
    errorElement.textContent = 'Failed to load posts. Please try refreshing the page.';
    errorElement.style.display = 'block';
  }
}

// Create post element
function createPostElement(post) {
  const postCard = document.createElement('div');
  postCard.className = 'post-card';
  postCard.dataset.postId = post.post_id;
  
  postCard.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <strong>${escapeHtml(post.display_name)}</strong>
        <span class="post-time">${formatPostTime(post.created_at)}</span>
        ${post.updated_at !== post.created_at ? '<span class="post-edited">(edited)</span>' : ''}
      </div>
      <div class="post-actions">
        <button class="edit-btn" onclick="editPost('${post.post_id}')">Edit</button>
        <button class="delete-btn" onclick="deletePostConfirm('${post.post_id}')">Delete</button>
      </div>
    </div>
    <div class="post-content">
      <p class="post-text">${escapeHtml(post.content)}</p>
    </div>
    <div class="post-edit-form" style="display: none;">
      <textarea class="edit-input" maxlength="280">${escapeHtml(post.content)}</textarea>
      <div class="edit-footer">
        <span class="edit-char-counter">${post.content.length}/280</span>
        <div class="edit-buttons">
          <button class="cancel-edit-btn" onclick="cancelEdit('${post.post_id}')">Cancel</button>
          <button class="save-edit-btn" onclick="saveEdit('${post.post_id}')">Save</button>
        </div>
      </div>
    </div>
  `;
  
  // Add character counter for edit textarea
  const editInput = postCard.querySelector('.edit-input');
  const editCharCounter = postCard.querySelector('.edit-char-counter');
  if (editInput && editCharCounter) {
    editInput.addEventListener('input', () => {
      const length = editInput.value.length;
      editCharCounter.textContent = `${length}/280`;
    });
  }
  
  return postCard;
}

// Edit post
window.editPost = function(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postCard) return;
  
  const content = postCard.querySelector('.post-content');
  const editForm = postCard.querySelector('.post-edit-form');
  const actions = postCard.querySelector('.post-actions');
  
  content.style.display = 'none';
  actions.style.display = 'none';
  editForm.style.display = 'block';
};

// Cancel edit
window.cancelEdit = function(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postCard) return;
  
  const content = postCard.querySelector('.post-content');
  const editForm = postCard.querySelector('.post-edit-form');
  const actions = postCard.querySelector('.post-actions');
  
  content.style.display = 'block';
  actions.style.display = 'flex';
  editForm.style.display = 'none';
};

// Save edit
window.saveEdit = async function(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postCard) return;
  
  const editInput = postCard.querySelector('.edit-input');
  const newContent = editInput.value.trim();
  
  if (!newContent || newContent.length > 280) {
    alert('Post content must be between 1 and 280 characters');
    return;
  }
  
  const saveBtn = postCard.querySelector('.save-edit-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  try {
    await updatePost(postId, newContent);
    
    // Reload posts
    await loadUserPosts();
  } catch (error) {
    alert('Failed to update post: ' + error.message);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
};

// Delete post with confirmation
window.deletePostConfirm = function(postId) {
  if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    deletePostAction(postId);
  }
};

// Delete post action
async function deletePostAction(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postCard) return;
  
  // Disable delete button
  const deleteBtn = postCard.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
  }
  
  try {
    await deletePost(postId);
    
    // Remove post from DOM with animation
    postCard.style.opacity = '0';
    setTimeout(() => {
      postCard.remove();
      
      // Check if posts list is empty
      const userPosts = document.getElementById('user-posts');
      if (userPosts.children.length === 0) {
        userPosts.innerHTML = '<p class="no-posts">You haven\'t posted anything yet.</p>';
      }
    }, 300);
  } catch (error) {
    alert('Failed to delete post: ' + error.message);
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete';
    }
  }
}

// Format post timestamp
function formatPostTime(isoString) {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

