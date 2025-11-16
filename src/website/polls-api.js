// Polls API Client

async function getPolls() {
  return apiGet('/polls');
}

async function votePoll(pollId, answer, reason = '') {
  const body = { answer };
  if (reason) {
    body.reason = reason;
  }
  return apiPost(`/polls/${pollId}/vote`, body);
}

// Gets the aggregated results for a specific poll
async function getPollResults(pollId) {
  return apiGet(`/polls/${pollId}/results`);
}

// Gets all poll votes made by a specific user
async function getUserPollVotes(userId = null) {
  const queryParams = buildQueryParams({ user_id: userId });
  return apiGet('/polls/user/votes', queryParams);
}

