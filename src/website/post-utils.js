// Shared Post Utilities
// This file contains reusable functions for rendering and managing posts

/**
 * Create a post element for display
 * @param {Object} post - Post object with post_id, user_id, display_name, content, created_at, updated_at
 * @param {boolean} isOwner - Whether the current user owns this post
 * @param {boolean} showEditButton - Whether to show edit button (default: false)
 * @returns {HTMLElement} Post card element
 */
function createPostElement(post, isOwner, showEditButton = false) {
  const postCard = document.createElement('div');
  postCard.className = 'post-card';
  postCard.dataset.postId = post.post_id;
  
  const editedLabel = post.updated_at !== post.created_at ? '<span class="post-edited">(edited)</span>' : '';
  
  // Build action buttons HTML
  let actionsHtml = '';
  if (isOwner) {
    actionsHtml = '<div class="post-actions">';
    if (showEditButton) {
      actionsHtml += `<button class="edit-btn" onclick="editPost('${post.post_id}')">Edit</button>`;
    }
    actionsHtml += `<button class="delete-btn" onclick="deletePostConfirm('${post.post_id}')">Delete</button>`;
    actionsHtml += '</div>';
  }
  
  postCard.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <strong><a href="profile.html?user_id=${post.user_id}" class="username-link">${escapeHtml(post.display_name)}</a></strong>
        <span class="post-time">${formatPostTime(post.created_at)}</span>
        ${editedLabel}
      </div>
      ${actionsHtml}
    </div>
    <div class="post-content">
      <p class="post-text">${escapeHtml(post.content)}</p>
    </div>
    ${showEditButton ? `
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
    ` : ''}
  `;
  
  // Add character counter for edit textarea if edit mode is enabled
  if (showEditButton) {
    const editInput = postCard.querySelector('.edit-input');
    const editCharCounter = postCard.querySelector('.edit-char-counter');
    if (editInput && editCharCounter) {
      editInput.addEventListener('input', () => {
        const length = editInput.value.length;
        editCharCounter.textContent = `${length}/280`;
      });
    }
  }
  
  return postCard;
}

/**
 * Format post timestamp for display in New Zealand time
 * @param {string} isoString - ISO 8601 timestamp string
 * @returns {string} Formatted date string
 */
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

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Delete post with confirmation dialog
 * @param {string} postId - ID of post to delete
 */
window.deletePostConfirm = function(postId) {
  if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    deletePostAction(postId);
  }
};

/**
 * Delete post action - performs the actual deletion
 * @param {string} postId - ID of post to delete
 */
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
      
      // Check if the feed/posts container is empty
      const parentContainer = postCard.parentElement;
      if (parentContainer && parentContainer.children.length === 0) {
        const containerId = parentContainer.id;
        if (containerId === 'feed') {
          parentContainer.innerHTML = '<p class="no-posts">No posts yet. Be the first to post!</p>';
        } else if (containerId === 'user-posts') {
          parentContainer.innerHTML = '<p class="no-posts">You haven\'t posted anything yet.</p>';
        }
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

