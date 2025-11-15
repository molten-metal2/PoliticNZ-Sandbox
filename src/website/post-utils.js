// Shared Post Utilities
// This file contains reusable functions for rendering and managing posts

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
        <strong><a href="profile.html?user_id=${post.user_id}">${escapeHtml(post.display_name)}</a></strong>
        <span class="post-time">${formatRelativeTime(post.created_at)}</span>
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
            <button class="save-edit-btn" onclick="saveEditPost('${post.post_id}')">Save</button>
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


// Cancel edit - hide edit form and show content

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

window.saveEdit = async function(postId, onSuccess) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postCard) return;
  
  const editInput = postCard.querySelector('.edit-input');
  const newContent = editInput.value.trim();
  
  const validation = validatePostContent(newContent);
  if (!validation.isValid) {
    alert(validation.error);
    return;
  }
  
  const saveBtn = postCard.querySelector('.save-edit-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  try {
    await updatePost(postId, newContent);
    
    if (onSuccess && typeof onSuccess === 'function') {
      await onSuccess();
    }
  } catch (error) {
    alert('Failed to update post: ' + error.message);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
};

window.deletePostConfirm = function(postId) {
  if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    deletePostAction(postId);
  }
};

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

