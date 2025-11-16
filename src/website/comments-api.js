// Comments and Likes API Client

async function likePost(postId) {
  return apiPost(`/posts/${postId}/like`, {});
}

async function getPostLikes(postId) {
  return apiGet(`/posts/${postId}/likes`);
}

async function createComment(postId, content) {
  return apiPost(`/posts/${postId}/comments`, { content });
}

async function getComments(postId) {
  return apiGet(`/posts/${postId}/comments`);
}

async function deleteComment(postId, commentId) {
  return apiDelete(`/posts/${postId}/comments/${commentId}`);
}

async function likeComment(postId, commentId) {
  return apiPost(`/posts/${postId}/comments/${commentId}/like`, {});
}

async function getCommentLikes(postId, commentId) {
  return apiGet(`/posts/${postId}/comments/${commentId}/likes`);
}

