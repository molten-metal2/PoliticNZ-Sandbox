// Profile API Client

/**
 * Get a user's profile
 * @param {string|null} userId - Optional user ID. If not provided, gets current user's profile
 * @returns {Promise<Object>} User profile or null if not found
 */
async function getProfile(userId = null) {
  try {
    const token = auth.getTokens().idToken;
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Build URL with optional user_id query parameter
    let url = `${CONFIG.API_URL}/profile`;
    if (userId) {
      url += `?user_id=${encodeURIComponent(userId)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      return null; // Profile doesn't exist yet
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

async function createProfile(profileData) {
  try {
    const token = auth.getTokens().idToken;
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.API_URL}/profile`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Create profile error:', error);
    throw error;
  }
}

async function updateProfile(updates) {
  try {
    const token = auth.getTokens().idToken;
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

async function hasProfile() {
  try {
    const profile = await getProfile();
    return profile !== null;
  } catch (error) {
    console.error('Profile check error:', error);
    return false;
  }
}

