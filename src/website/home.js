// Home page - Protect page and check onboarding

// Protect this page - redirect to login if not authenticated
if (!auth.isAuthenticated()) {
  window.location.href = 'index.html';
}

// Check if user has completed onboarding
(async function checkOnboarding() {
  try {
    const profile = await getProfile();
    if (!profile) {
      window.location.href = 'onboarding.html';
    }
  } catch (error) {
    console.error('Error checking profile:', error);
    // If there's an error, still allow access but log it
  }
})();

