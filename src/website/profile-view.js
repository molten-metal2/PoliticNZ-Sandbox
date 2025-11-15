/**
 * Profile View Module
 * Handles profile display, loading, and view/edit mode toggling
 */

// Module state (exported for coordination)
const ProfileView = {
  originalProfile: null,
  isEditMode: false,
  currentUserId: null,
  viewedUserId: null,
  isOwnProfile: false
};

async function loadProfile() {
  const loading = document.getElementById('loading');
  const profileContent = document.getElementById('profile-content');
  const errorContent = document.getElementById('error-content');
  
  try {
    // Get current user's profile to establish their identity
    const currentUserProfile = await getProfile();
    
    if (!currentUserProfile) {
      // Current user has no profile, redirect to onboarding
      window.location.href = 'onboarding.html';
      return;
    }
    
    ProfileView.currentUserId = currentUserProfile.user_id;
    
    // Determine if viewing own profile or another user's
    ProfileView.isOwnProfile = !ProfileView.viewedUserId || ProfileView.viewedUserId === ProfileView.currentUserId;
    
    // Load the appropriate profile
    const profile = ProfileView.isOwnProfile ? currentUserProfile : await getProfile(ProfileView.viewedUserId);
    
    if (!profile) {
      loading.style.display = 'none';
      errorContent.innerHTML = `
        <p>Profile not found.</p>
        <button onclick="window.location.href='home.html'">Go Home</button>
      `;
      errorContent.style.display = 'block';
      return;
    }
    
    // Store original data (for editing own profile)
    ProfileView.originalProfile = profile;
    
    // Update page title
    const pageTitle = ProfileView.isOwnProfile ? 'My Profile' : `${profile.display_name}'s Profile`;
    document.title = `${pageTitle} - PoliticNZ`;
    document.querySelector('h1').textContent = pageTitle;
    
    // Populate form fields
    document.getElementById('display_name').value = profile.display_name || '';
    document.getElementById('bio').value = profile.bio || '';
    document.getElementById('political_alignment').value = profile.political_alignment || '';
    
    // Display read-only fields
    document.getElementById('user_id').textContent = profile.user_id || 'N/A';
    document.getElementById('created_at').textContent = formatDate(profile.created_at);
    document.getElementById('updated_at').textContent = formatDate(profile.updated_at);
    
    updateBioCounter();
    
    setViewMode();
    
    // Show/hide edit button based on ownership
    document.getElementById('view-mode-buttons').style.display = ProfileView.isOwnProfile ? 'block' : 'none';
    document.getElementById('edit-mode-buttons').style.display = 'none';
    
    // Show profile content
    loading.style.display = 'none';
    profileContent.style.display = 'block';
    
    loadUserPosts();
    
  } catch (error) {
    console.error('Failed to load profile:', error);
    loading.style.display = 'none';
    errorContent.innerHTML = `
      <p>Failed to load profile. Please try again.</p>
      <button onclick="window.location.reload()">Retry</button>
      <button onclick="window.location.href='home.html'">Go Home</button>
    `;
    errorContent.style.display = 'block';
  }
}

function setViewMode() {
  ProfileView.isEditMode = false;
  
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
  ProfileView.isEditMode = true;
  
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

function updateBioCounter() {
  const bio = document.getElementById('bio');
  const charCount = bio.value.length;
  const counter = document.getElementById('bio-counter');
  counter.textContent = `${charCount}/500 characters`;
}

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
    
    // Load posts for the viewed user
    const posts = ProfileView.isOwnProfile ? await getUserPosts() : await getUserPosts(ProfileView.viewedUserId);
    
    loadingElement.style.display = 'none';
    
    if (posts.length === 0) {
      const noPostsMessage = ProfileView.isOwnProfile 
        ? "You haven't posted anything yet."
        : "This user hasn't posted anything yet.";
      postsElement.innerHTML = `<p class="no-posts">${noPostsMessage}</p>`;
      return;
    }
    
    // Update section title
    const sectionTitle = postsSection.querySelector('h2');
    if (sectionTitle) {
      sectionTitle.textContent = ProfileView.isOwnProfile ? 'My Posts' : 'Posts';
    }
    
    // Display each post
    posts.forEach(post => {
      // Show edit button only if viewing own profile
      const showEditButton = ProfileView.isOwnProfile;
      const postElement = createPostElement(post, ProfileView.isOwnProfile, showEditButton);
      postsElement.appendChild(postElement);
    });
    
  } catch (error) {
    console.error('Failed to load user posts:', error);
    loadingElement.style.display = 'none';
    errorElement.textContent = 'Failed to load posts. Please try refreshing the page.';
    errorElement.style.display = 'block';
  }
}

