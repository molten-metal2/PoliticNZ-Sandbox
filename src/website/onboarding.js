// Onboarding flow for first-time users

// Check if user is authenticated
if (!auth.isAuthenticated()) {
  window.location.href = 'index.html';
}

// Check if user already has a profile
checkExistingProfile();

async function checkExistingProfile() {
  try {
    const profile = await getProfile();
    if (profile) {
      // User already has a profile, redirect to home
      window.location.href = 'home.html';
    }
  } catch (error) {
    console.error('Error checking profile:', error);
  }
}

// Handle form submission
document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitButton = document.getElementById('submitButton');
  const errorMessage = document.getElementById('error-message');
  
  // Disable button during submission
  submitButton.disabled = true;
  submitButton.textContent = 'Creating profile...';
  errorMessage.style.display = 'none';
  
  try {
    // Get form values
    const displayName = document.getElementById('display_name').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const politicalAlignment = document.getElementById('political_alignment').value;
    
    // Client-side validation
    const validation = validateProfileData(displayName, bio, politicalAlignment);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Build profile data
    const profileData = {
      display_name: displayName,
      bio: bio,
      political_alignment: politicalAlignment
    };
    
    // Create profile
    const profile = await createProfile(profileData);
    
    // Success - redirect to home
    window.location.href = 'home.html';
    
  } catch (error) {
    // Show error message
    errorMessage.textContent = error.message || 'Failed to create profile. Please try again.';
    errorMessage.style.display = 'block';
    
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = 'Complete Profile';
  }
});

// Real-time character counter for bio
document.getElementById('bio').addEventListener('input', (e) => {
  const charCount = e.target.value.length;
  const small = e.target.parentElement.querySelector('small');
  small.textContent = `${charCount}/500 characters`;
});

