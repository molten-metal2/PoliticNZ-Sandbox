// Home page - Protect page and check onboarding

// Protect this page - redirect to login if not authenticated
if (!auth.isAuthenticated()) {
  window.location.href = 'index.html';
}

let currentUserId = null;

// Check if user has completed onboarding and get user ID
(async function checkOnboarding() {
  try {
    const profile = await getProfile();
    if (!profile) {
      window.location.href = 'onboarding.html';
      return;
    }
    // Store user ID for checking post ownership
    currentUserId = profile.user_id;
    
    // Load feed after profile check
    loadFeed();
  } catch (error) {
    console.error('Error checking profile:', error);
    // If there's an error, still allow access but log it
  }
})();

// Post input functionality
const postInput = document.getElementById('post-input');
const postBtn = document.getElementById('post-btn');
const charCounter = document.getElementById('char-counter');

// Character counter
postInput.addEventListener('input', () => {
  const length = postInput.value.length;
  charCounter.textContent = `${length}/280`;
  
  // Disable button if empty or exceeds limit
  postBtn.disabled = length === 0 || length > 280;
});

// Post creation
postBtn.addEventListener('click', async () => {
  const content = postInput.value.trim();
  
  if (!content || content.length > 280) {
    return;
  }
  
  // Disable button during submission
  postBtn.disabled = true;
  postBtn.textContent = 'Posting...';
  
  try {
    await createPost(content);
    
    // Clear input
    postInput.value = '';
    charCounter.textContent = '0/280';
    
    // Reload feed
    await loadFeed();
    
    // Re-enable button
    postBtn.textContent = 'Post';
    postBtn.disabled = false;
  } catch (error) {
    alert('Failed to create post: ' + error.message);
    postBtn.textContent = 'Post';
    postBtn.disabled = false;
  }
});

// Load and display feed
async function loadFeed() {
  const feedElement = document.getElementById('feed');
  const loadingElement = document.getElementById('feed-loading');
  const errorElement = document.getElementById('feed-error');
  
  try {
    loadingElement.style.display = 'block';
    errorElement.style.display = 'none';
    feedElement.innerHTML = '';
    
    const posts = await getFeed();
    
    loadingElement.style.display = 'none';
    
    if (posts.length === 0) {
      feedElement.innerHTML = '<p class="no-posts">No posts yet. Be the first to post!</p>';
      return;
    }
    
    // Display each post
    posts.forEach(post => {
      const postElement = createPostElement(post);
      feedElement.appendChild(postElement);
    });
    
  } catch (error) {
    console.error('Failed to load feed:', error);
    loadingElement.style.display = 'none';
    errorElement.textContent = 'Failed to load feed. Please try refreshing the page.';
    errorElement.style.display = 'block';
  }
}

// Create post element
function createPostElement(post) {
  const postCard = document.createElement('div');
  postCard.className = 'post-card';
  postCard.dataset.postId = post.post_id;
  
  const isOwner = post.user_id === currentUserId;
  
  postCard.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <strong>${escapeHtml(post.display_name)}</strong>
        <span class="post-time">${formatPostTime(post.created_at)}</span>
        ${post.updated_at !== post.created_at ? '<span class="post-edited">(edited)</span>' : ''}
      </div>
      ${isOwner ? `
        <div class="post-actions">
          <button class="delete-btn" onclick="deletePostConfirm('${post.post_id}')">Delete</button>
        </div>
      ` : ''}
    </div>
    <div class="post-content">
      <p class="post-text">${escapeHtml(post.content)}</p>
    </div>
  `;
  
  return postCard;
}

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
      
      // Check if feed is empty
      const feed = document.getElementById('feed');
      if (feed.children.length === 0) {
        feed.innerHTML = '<p class="no-posts">No posts yet. Be the first to post!</p>';
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
