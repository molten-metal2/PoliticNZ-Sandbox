// Home page - Protect page and check onboarding

// Protect this page - redirect to login if not authenticated
requireAuth();

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
  
  // Validate content
  const validation = validatePostContent(content);
  if (!validation.isValid) {
    alert(validation.error);
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
      const isOwner = post.user_id === currentUserId;
      const postElement = createPostElement(post, isOwner, false);
      feedElement.appendChild(postElement);
    });
    
  } catch (error) {
    console.error('Failed to load feed:', error);
    loadingElement.style.display = 'none';
    errorElement.textContent = 'Failed to load feed. Please try refreshing the page.';
    errorElement.style.display = 'block';
  }
}

// Note: deletePostConfirm, deletePostAction, formatPostTime, and escapeHtml 
// are now provided by post-utils.js
