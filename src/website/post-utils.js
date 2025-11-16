// Shared Post Utilities
// This file contains reusable functions for rendering and managing posts

function createPostElement(post, isOwner, showEditButton = false, showDeleteButton = false, showCommentsPreview = true) {
  const postCard = document.createElement('div');
  postCard.className = 'post-card';
  postCard.dataset.postId = post.post_id;
  
  const editedLabel = post.updated_at !== post.created_at ? '<span class="post-edited">(edited)</span>' : '';
  
  // Build action buttons HTML
  let actionsHtml = '';
  if (isOwner && (showEditButton || showDeleteButton)) {
    actionsHtml = '<div class="post-actions">';
    if (showEditButton) {
      actionsHtml += `<button class="edit-btn" onclick="editPost('${post.post_id}')">Edit</button>`;
    }
    if (showDeleteButton) {
    actionsHtml += `<button class="delete-btn" onclick="deletePostConfirm('${post.post_id}')">Delete</button>`;
    }
    actionsHtml += '</div>';
  }
  
  // Like/Comment counts
  const likeCount = post.like_count || 0;
  const commentCount = post.comment_count || 0;
  const likedByUser = post.liked_by_user || false;
  const likedClass = likedByUser ? 'liked' : '';
  
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
    <div class="post-interactions">
      <button class="like-btn ${likedClass}" data-post-id="${post.post_id}">
        <span class="like-icon">❤</span>
        <span class="like-count">${likeCount}</span>
      </button>
      <button class="comment-btn" onclick="viewPostDetail('${post.post_id}')">
        <span class="comment-icon">💬</span>
        <span class="comment-count">${commentCount}</span>
      </button>
    </div>
    ${showCommentsPreview ? `<div class="comments-preview" data-post-id="${post.post_id}"></div>` : ''}
    ${showEditButton ? `
      <div class="post-edit-form" style="display: none;">
        <textarea class="edit-input" maxlength="${getValidationConstants().POST_CONTENT_MAX_LENGTH}">${escapeHtml(post.content)}</textarea>
        <div class="edit-footer">
          <span class="edit-char-counter">${post.content.length}/${getValidationConstants().POST_CONTENT_MAX_LENGTH}</span>
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
      const maxLength = getValidationConstants().POST_CONTENT_MAX_LENGTH;
      editInput.addEventListener('input', () => {
        const length = editInput.value.length;
        editCharCounter.textContent = `${length}/${maxLength}`;
      });
    }
  }
  
  // Add like button click handler
  const likeBtn = postCard.querySelector('.like-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await togglePostLike(post.post_id, likeBtn);
    });
  }
  
  // Load comments preview if enabled
  if (showCommentsPreview && commentCount > 0) {
    loadCommentsPreview(post.post_id);
  }
  
  return postCard;
}

// Create poll vote element for display on profile
function createPollVoteElement(vote) {
  const voteCard = document.createElement('div');
  voteCard.className = 'poll-vote-card';
  
  voteCard.innerHTML = `
    <div class="poll-vote-header">
      <div class="poll-vote-author">
        <strong><a href="profile.html?user_id=${vote.user_id}">${escapeHtml(vote.display_name)}</a></strong>
        <span class="poll-vote-time">${formatRelativeTime(vote.voted_at)}</span>
      </div>
      <span class="poll-vote-badge">Poll Vote</span>
    </div>
    <div class="poll-vote-content">
      <p class="poll-vote-question">${escapeHtml(vote.question)}</p>
      <p class="poll-vote-answer"><strong>Voted:</strong> ${escapeHtml(vote.answer)}</p>
      ${vote.reason ? `<p class="poll-vote-reason">"${escapeHtml(vote.reason)}"</p>` : ''}
    </div>
  `;
  
  return voteCard;
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

// Toggle like on a post
async function togglePostLike(postId, likeBtn) {
  if (likeBtn.disabled) return;
  
  likeBtn.disabled = true;
  const likeCountSpan = likeBtn.querySelector('.like-count');
  const currentCount = parseInt(likeCountSpan.textContent) || 0;
  const isLiked = likeBtn.classList.contains('liked');
  
  try {
    const result = await likePost(postId);
    
    // Update UI based on result
    if (result.liked) {
      likeBtn.classList.add('liked');
      likeCountSpan.textContent = currentCount + 1;
    } else {
      likeBtn.classList.remove('liked');
      likeCountSpan.textContent = Math.max(0, currentCount - 1);
    }
  } catch (error) {
    console.error('Failed to toggle like:', error);
    alert('Failed to like post. Please try again.');
  } finally {
    likeBtn.disabled = false;
  }
}

// Load comments preview (first 2-3 comments)
async function loadCommentsPreview(postId) {
  const previewContainer = document.querySelector(`.comments-preview[data-post-id="${postId}"]`);
  if (!previewContainer) return;
  
  try {
    const comments = await getComments(postId);
    
    if (comments.length === 0) {
      previewContainer.style.display = 'none';
      return;
    }
    
    // Show first 2 comments
    const previewComments = comments.slice(0, 2);
    
    let previewHtml = '<div class="comments-preview-list">';
    previewComments.forEach(comment => {
      previewHtml += `
        <div class="comment-preview">
          <strong>${escapeHtml(comment.display_name)}</strong>
          <span>${escapeHtml(comment.content)}</span>
        </div>
      `;
    });
    
    if (comments.length > 2) {
      previewHtml += `<a href="post-detail.html?post_id=${postId}" class="view-all-comments">View all ${comments.length} comments</a>`;
    } else if (comments.length > 0) {
      previewHtml += `<a href="post-detail.html?post_id=${postId}" class="view-all-comments">View comments</a>`;
    }
    
    previewHtml += '</div>';
    previewContainer.innerHTML = previewHtml;
    previewContainer.style.display = 'block';
  } catch (error) {
    console.error('Failed to load comments preview:', error);
    previewContainer.style.display = 'none';
  }
}

// Navigate to post detail page
window.viewPostDetail = function(postId) {
  window.location.href = `post-detail.html?post_id=${postId}`;
};

