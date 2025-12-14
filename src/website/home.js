// Home page

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
    
    // Load polls and feed after profile check
    initializePolls();
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
const constants = getValidationConstants();
postInput.addEventListener('input', () => {
  const length = postInput.value.length;
  charCounter.textContent = `${length}/${constants.POST_CONTENT_MAX_LENGTH}`;
  
  // Disable button if empty or exceeds limit
  postBtn.disabled = length === 0 || length > constants.POST_CONTENT_MAX_LENGTH;
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
    charCounter.textContent = `0/${constants.POST_CONTENT_MAX_LENGTH}`;
    
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
      // On home page: no edit button, no delete button (home page is intended to be a read only feed)
      const postElement = createPostElement(post, isOwner, false, false);
      feedElement.appendChild(postElement);
    });
    
  } catch (error) {
    console.error('Failed to load feed:', error);
    loadingElement.style.display = 'none';
    errorElement.textContent = 'Failed to load feed. Please try refreshing the page.';
    errorElement.style.display = 'block';
  }
}
