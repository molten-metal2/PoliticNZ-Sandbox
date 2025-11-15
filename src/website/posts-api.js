// Posts API Client

async function createPost(content) {
  try {
    const token = auth.getTokens().idToken;
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create post');
    }

    return await response.json();
  } catch (error) {
    console.error('Create post error:', error);
    throw error;
  }
}

async function getFeed() {
  try {
    const token = auth.getTokens().idToken;
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.API_URL}/posts`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get feed');
    }

    return await response.json();
  } catch (error) {
    console.error('Get feed error:', error);
    throw error;
  }
}

async function getUserPosts() {
  try {
    const token = auth.getTokens().idToken;
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.API_URL}/posts/user`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user posts');
    }

    return await response.json();
  } catch (error) {
    console.error('Get user posts error:', error);
    throw error;
  }
}

async function updatePost(postId, content) {
  try {
    const token = auth.getTokens().idToken;
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.API_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update post');
    }

    return await response.json();
  } catch (error) {
    console.error('Update post error:', error);
    throw error;
  }
}

async function deletePost(postId) {
  try {
    const token = auth.getTokens().idToken;
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete post');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete post error:', error);
    throw error;
  }
}

