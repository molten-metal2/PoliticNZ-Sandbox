// Posts API Client

async function createPost(content) {
  return apiPost('/posts', { content });
}

async function getFeed() {
  return apiGet('/posts');
}

async function getUserPosts(userId = null) {
  const queryParams = buildQueryParams({ user_id: userId });
  return apiGet('/posts/user', queryParams);
}

async function updatePost(postId, content) {
  return apiPut(`/posts/${postId}`, { content });
}

async function deletePost(postId) {
  return apiDelete(`/posts/${postId}`);
}
