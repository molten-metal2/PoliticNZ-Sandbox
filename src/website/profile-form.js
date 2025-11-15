/**
 * Profile Form Module
 * Handles profile form submission, editing, and validation
 */

function initProfileForm() {
  document.getElementById('editButton').addEventListener('click', () => {
    if (ProfileView.isOwnProfile) {
      setEditMode();
    }
  });

  document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
  document.getElementById('cancelButton').addEventListener('click', handleCancelEdit);
  document.getElementById('bio').addEventListener('input', updateBioCounter);
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  
  if (!ProfileView.isOwnProfile) {
    return;
  }
  
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
    const validation = validateProfileData(displayName, bio, politicalAlignment);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const hasChanges = 
      displayName !== ProfileView.originalProfile.display_name ||
      bio !== ProfileView.originalProfile.bio ||
      politicalAlignment !== ProfileView.originalProfile.political_alignment;
    
    if (!hasChanges) {
      successMessage.textContent = 'No changes to save';
      successMessage.style.display = 'block';
      submitButton.disabled = false;
      submitButton.textContent = 'Update Profile';
      return;
    }
    
    const updates = {
      display_name: displayName,
      bio: bio,
      political_alignment: politicalAlignment
    };
    
    await updateProfile(updates);
    
    ProfileView.originalProfile.display_name = displayName;
    ProfileView.originalProfile.bio = bio;
    ProfileView.originalProfile.political_alignment = politicalAlignment;
    ProfileView.originalProfile.updated_at = new Date().toISOString();
    
    // Update the updated_at display
    document.getElementById('updated_at').textContent = formatDate(ProfileView.originalProfile.updated_at);
    
    // Show success message
    successMessage.textContent = 'Profile updated successfully!';
    successMessage.style.display = 'block';
    
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = 'Save Changes';
    
    // Return to view mode after successful save
    setTimeout(() => {
      setViewMode();
    }, 1500);
    
  } catch (error) {
    errorMessage.textContent = error.message || 'Failed to update profile. Please try again.';
    errorMessage.style.display = 'block';
    
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = 'Save Changes';
  }
}

function handleCancelEdit() {
  if (ProfileView.originalProfile) {
    // Restore original values
    document.getElementById('display_name').value = ProfileView.originalProfile.display_name || '';
    document.getElementById('bio').value = ProfileView.originalProfile.bio || '';
    document.getElementById('political_alignment').value = ProfileView.originalProfile.political_alignment || '';
    
    updateBioCounter();
    
    setViewMode();
  }
}

