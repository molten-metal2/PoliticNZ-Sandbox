// Post Detail Page

requireAuth();

let currentUserId = null;
let currentPost = null;

// Get post_id from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('post_id');

if (!postId) {
  window.location.href = 'home.html';
}

// Initialize page
(async function init() {
  try {
    const profile = await getProfile();
    currentUserId = profile.user_id;
    
    await loadPost();
    await loadComments();
  } catch (error) {
    console.error('Error initializing page:', error);
  }
})();

// Load the post
async function loadPost() {
  const postContainer = document.getElementById('post-container');
  const loadingElement = document.getElementById('post-loading');
  const errorElement = document.getElementById('post-error');
  
  try {
    loadingElement.style.display = 'block';
    errorElement.style.display = 'none';
    postContainer.innerHTML = '';
    
    // Get all posts and find the one we need (or create a dedicated endpoint)
    const posts = await getFeed();
    currentPost = posts.find(p => p.post_id === postId);
    
    if (!currentPost) {
      errorElement.textContent = 'Post not found.';
      errorElement.style.display = 'block';
      loadingElement.style.display = 'none';
      return;
    }
    
    loadingElement.style.display = 'none';
    
    // Display the post (no comments preview, no edit/delete buttons in main display)
    const isOwner = currentPost.user_id === currentUserId;
    const postElement = createPostElement(currentPost, isOwner, false, false, false);
    postContainer.appendChild(postElement);
    
    // Show likes section
    if (currentPost.like_count > 0) {
      loadLikes();
    }
    
    // Show comments section
    document.getElementById('comments-section').style.display = 'block';
    
  } catch (error) {
    console.error('Failed to load post:', error);
    loadingElement.style.display = 'none';
    errorElement.textContent = 'Failed to load post. Please try refreshing the page.';
    errorElement.style.display = 'block';
  }
}

// Load likes
async function loadLikes() {
  const likesSection = document.getElementById('likes-section');
  const likesList = document.getElementById('likes-list');
  
  try {
    const result = await getPostLikes(postId);
    
    if (result.count > 0) {
      likesSection.style.display = 'block';
      likesList.innerHTML = result.likes.map(user => `
        <div class="like-item">
          <a href="profile.html?user_id=${user.user_id}">${escapeHtml(user.display_name)}</a>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load likes:', error);
  }
}

// Load comments
async function loadComments() {
  const commentsLoadingElement = document.getElementById('comments-loading');
  const commentsListElement = document.getElementById('comments-list');
  
  try {
    commentsLoadingElement.style.display = 'block';
    commentsListElement.innerHTML = '';
    
    const comments = await getComments(postId);
    
    commentsLoadingElement.style.display = 'none';
    
    if (comments.length === 0) {
      commentsListElement.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
      return;
    }
    
    comments.forEach(comment => {
      const commentElement = createCommentElement(comment);
      commentsListElement.appendChild(commentElement);
    });
    
  } catch (error) {
    console.error('Failed to load comments:', error);
    commentsLoadingElement.style.display = 'none';
    commentsListElement.innerHTML = '<p class="error">Failed to load comments.</p>';
  }
}

// Create comment element
function createCommentElement(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment-item';
  commentDiv.dataset.commentId = comment.comment_id;
  
  const isOwner = comment.user_id === currentUserId;
  const likeCount = comment.like_count || 0;
  const likedByUser = comment.liked_by_user || false;
  const likedClass = likedByUser ? 'liked' : '';
  
  commentDiv.innerHTML = `
    <div class="comment-header">
      <div class="comment-author">
        <strong><a href="profile.html?user_id=${comment.user_id}">${escapeHtml(comment.display_name)}</a></strong>
        <span class="comment-time">${formatRelativeTime(comment.created_at)}</span>
      </div>
      ${isOwner ? `<button class="delete-comment-btn" data-comment-id="${comment.comment_id}">Delete</button>` : ''}
    </div>
    <div class="comment-content">
      <p>${escapeHtml(comment.content)}</p>
    </div>
    <div class="comment-interactions">
      <button class="like-comment-btn ${likedClass}" data-comment-id="${comment.comment_id}">
        <span class="like-icon">❤</span>
        <span class="like-count">${likeCount}</span>
      </button>
    </div>
  `;
  
  // Add delete handler
  const deleteBtn = commentDiv.querySelector('.delete-comment-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Delete this comment?')) {
        await deleteCommentAction(comment.comment_id, commentDiv);
      }
    });
  }
  
  // Add like handler
  const likeBtn = commentDiv.querySelector('.like-comment-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      await toggleCommentLike(comment.comment_id, likeBtn);
    });
  }
  
  return commentDiv;
}

// Toggle like on a comment
async function toggleCommentLike(commentId, likeBtn) {
  if (likeBtn.disabled) return;
  
  likeBtn.disabled = true;
  const likeCountSpan = likeBtn.querySelector('.like-count');
  const currentCount = parseInt(likeCountSpan.textContent) || 0;
  
  try {
    const result = await likeComment(postId, commentId);
    
    // Update UI based on result
    if (result.liked) {
      likeBtn.classList.add('liked');
      likeCountSpan.textContent = currentCount + 1;
    } else {
      likeBtn.classList.remove('liked');
      likeCountSpan.textContent = Math.max(0, currentCount - 1);
    }
  } catch (error) {
    console.error('Failed to toggle comment like:', error);
    alert('Failed to like comment. Please try again.');
  } finally {
    likeBtn.disabled = false;
  }
}

// Delete comment
async function deleteCommentAction(commentId, commentElement) {
  try {
    await deleteComment(postId, commentId);
    
    // Remove comment from DOM with animation
    commentElement.style.opacity = '0';
    setTimeout(() => {
      commentElement.remove();
      
      // Check if comments list is empty
      const commentsList = document.getElementById('comments-list');
      if (commentsList.children.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
      }
    }, 300);
  } catch (error) {
    console.error('Failed to delete comment:', error);
    alert('Failed to delete comment. Please try again.');
  }
}

// Comment input functionality
const commentInput = document.getElementById('comment-input');
const commentBtn = document.getElementById('comment-btn');
const commentCharCounter = document.getElementById('comment-char-counter');

// Character counter
const constants = getValidationConstants();
commentInput.addEventListener('input', () => {
  const length = commentInput.value.length;
  commentCharCounter.textContent = `${length}/${constants.COMMENT_CONTENT_MAX_LENGTH}`;
  
  // Disable button if empty or exceeds limit
  commentBtn.disabled = length === 0 || length > constants.COMMENT_CONTENT_MAX_LENGTH;
});

// Comment submission
commentBtn.addEventListener('click', async () => {
  const content = commentInput.value.trim();
  
  // Validate content
  const validation = validateCommentContent(content);
  if (!validation.isValid) {
    alert(validation.error);
    return;
  }
  
  // Disable button during submission
  commentBtn.disabled = true;
  commentBtn.textContent = 'Posting...';
  
  try {
    const newComment = await createComment(postId, content);
    
    // Clear input
    commentInput.value = '';
    commentCharCounter.textContent = `0/${constants.COMMENT_CONTENT_MAX_LENGTH}`;
    
    // Add new comment to the list
    const commentsList = document.getElementById('comments-list');
    const noComments = commentsList.querySelector('.no-comments');
    if (noComments) {
      noComments.remove();
    }
    
    // Add comment counts for the new comment
    newComment.like_count = 0;
    newComment.liked_by_user = false;
    
    const commentElement = createCommentElement(newComment);
    commentsList.appendChild(commentElement);
    
    // Re-enable button
    commentBtn.textContent = 'Comment';
    commentBtn.disabled = false;
    
    // Update comment count in the post
    if (currentPost) {
      currentPost.comment_count = (currentPost.comment_count || 0) + 1;
      const commentCountSpan = document.querySelector('.comment-count');
      if (commentCountSpan) {
        commentCountSpan.textContent = currentPost.comment_count;
      }
    }
  } catch (error) {
    alert('Failed to post comment: ' + error.message);
    commentBtn.textContent = 'Comment';
    commentBtn.disabled = false;
  }
});

