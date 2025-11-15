// Profile view and edit functionality

// Check if user is authenticated
if (!auth.isAuthenticated()) {
  window.location.href = 'index.html';
}

// Store original profile data for cancel functionality
let originalProfile = null;

// Load profile on page load
loadProfile();

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
    
    // Show profile content
    loading.style.display = 'none';
    profileContent.style.display = 'block';
    
  } catch (error) {
    console.error('Failed to load profile:', error);
    loading.style.display = 'none';
    errorContent.style.display = 'block';
  }
}

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
    const updatedProfile = await updateProfile(updates);
    
    // Update original profile with new data
    originalProfile = updatedProfile;
    
    // Update the updated_at display
    document.getElementById('updated_at').textContent = formatDate(updatedProfile.updated_at);
    
    // Show success message
    successMessage.textContent = 'Profile updated successfully!';
    successMessage.style.display = 'block';
    
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = 'Update Profile';
    
  } catch (error) {
    // Show error message
    errorMessage.textContent = error.message || 'Failed to update profile. Please try again.';
    errorMessage.style.display = 'block';
    
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = 'Update Profile';
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
    
    // Hide messages
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
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

// Format date for display
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-NZ', {
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

