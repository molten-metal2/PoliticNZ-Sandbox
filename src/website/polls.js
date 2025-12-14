// Polls UI Component

let polls = [];
let currentPollIndex = 0;
let votedPolls = new Set();

// Initialize polls
async function initializePolls() {
  const pollsContainer = document.getElementById('polls-container');
  const pollsLoading = document.getElementById('polls-loading');
  const pollsError = document.getElementById('polls-error');
  
  try {
    pollsLoading.style.display = 'block';
    pollsError.style.display = 'none';
    
    polls = await getPolls();
    
    pollsLoading.style.display = 'none';
    
    if (polls.length === 0) {
      pollsContainer.innerHTML = '<p class="no-polls">No polls available at this time.</p>';
      return;
    }
    
    // Track which polls user has already voted on
    polls.forEach(poll => {
      if (poll.has_voted) {
        votedPolls.add(poll.poll_id);
      }
    });
    
    renderPoll();
    
  } catch (error) {
    console.error('Failed to load polls:', error);
    pollsLoading.style.display = 'none';
    pollsError.textContent = 'Failed to load polls. Please try refreshing the page.';
    pollsError.style.display = 'block';
  }
}

// Render current poll
function renderPoll() {
  const pollsCarousel = document.getElementById('polls-carousel');
  
  if (!polls || polls.length === 0) {
    return;
  }
  
  const poll = polls[currentPollIndex];
  const hasVoted = votedPolls.has(poll.poll_id);
  
  let pollHtml = `
    <div class="poll-card">
      <div class="poll-header">
        <h3 class="poll-question">${poll.question}</h3>
        <p class="poll-info">${poll.info_text}</p>
      </div>
  `;
  
  if (hasVoted) {
    // Show results if already voted
    pollHtml += `
      <div class="poll-results" id="poll-results-${poll.poll_id}">
        <p class="poll-results-loading">Loading results...</p>
      </div>
    `;
  } else {
    // Show voting interface
    pollHtml += `
      <div class="poll-options">
        <label class="poll-option">
          <input type="radio" name="poll-answer" value="Yes">
          <span>Yes</span>
        </label>
        <label class="poll-option">
          <input type="radio" name="poll-answer" value="No">
          <span>No</span>
        </label>
      </div>
      
      <div class="poll-reason-container">
        <textarea 
          id="poll-reason" 
          class="poll-reason" 
          placeholder="Why? (Optional, max 280 characters)" 
          maxlength="280"
        ></textarea>
        <span id="poll-reason-counter" class="poll-reason-counter">0/280</span>
      </div>
      
      <button id="poll-vote-btn" class="poll-vote-btn" disabled>Vote</button>
    `;
  }
  
  pollHtml += `
    </div>
  `;
  
  // Add navigation arrows if multiple polls
  if (polls.length > 1) {
    pollHtml = `
      <button class="poll-nav poll-nav-left" id="poll-nav-left" ${currentPollIndex === 0 ? 'disabled' : ''}>
        &#8249;
      </button>
      ${pollHtml}
      <button class="poll-nav poll-nav-right" id="poll-nav-right" ${currentPollIndex === polls.length - 1 ? 'disabled' : ''}>
        &#8250;
      </button>
    `;
  }
  
  pollsCarousel.innerHTML = pollHtml;
  
  // If already voted, load results
  if (hasVoted) {
    loadPollResults(poll.poll_id);
  } else {
    // Set up event listeners for voting
    setupVotingListeners(poll);
  }
  
  // Set up navigation listeners
  if (polls.length > 1) {
    const leftBtn = document.getElementById('poll-nav-left');
    const rightBtn = document.getElementById('poll-nav-right');
    
    if (leftBtn) {
      leftBtn.addEventListener('click', () => navigatePoll(-1));
    }
    if (rightBtn) {
      rightBtn.addEventListener('click', () => navigatePoll(1));
    }
  }
}

// Set up voting event listeners
function setupVotingListeners(poll) {
  const voteBtn = document.getElementById('poll-vote-btn');
  const reasonInput = document.getElementById('poll-reason');
  const reasonCounter = document.getElementById('poll-reason-counter');
  const radioButtons = document.querySelectorAll('input[name="poll-answer"]');
  
  // Enable vote button when answer selected
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      voteBtn.disabled = false;
    });
  });
  
  // Character counter for reason
  if (reasonInput && reasonCounter) {
    reasonInput.addEventListener('input', () => {
      const length = reasonInput.value.length;
      reasonCounter.textContent = `${length}/280`;
    });
  }
  
  // Vote button handler
  if (voteBtn) {
    voteBtn.addEventListener('click', () => submitVote(poll));
  }
}

// Submit vote
async function submitVote(poll) {
  const selectedAnswer = document.querySelector('input[name="poll-answer"]:checked');
  
  if (!selectedAnswer) {
    alert('Please select an answer');
    return;
  }
  
  const answer = selectedAnswer.value;
  const reasonInput = document.getElementById('poll-reason');
  const reason = reasonInput ? reasonInput.value.trim() : '';
  const voteBtn = document.getElementById('poll-vote-btn');
  
  // Disable button during submission
  voteBtn.disabled = true;
  voteBtn.textContent = 'Voting...';
  
  try {
    await votePoll(poll.poll_id, answer, reason);
    
    // Mark poll as voted
    votedPolls.add(poll.poll_id);
    
    // Show results
    renderPoll();
    
    // Auto-advance to next poll after 2 seconds if available
    if (currentPollIndex < polls.length - 1) {
      setTimeout(() => {
        navigatePoll(1);
      }, 2000);
    }
    
  } catch (error) {
    alert('Failed to submit vote: ' + error.message);
    voteBtn.textContent = 'Vote';
    voteBtn.disabled = false;
  }
}

// Load and display poll results
async function loadPollResults(pollId) {
  const resultsContainer = document.getElementById(`poll-results-${pollId}`);
  
  if (!resultsContainer) {
    return;
  }
  
  try {
    const results = await getPollResults(pollId);
    
    resultsContainer.innerHTML = `
      <p class="poll-results-title">Results</p>
      <div class="poll-result-item">
        <div class="poll-result-label">
          <span>Yes</span>
          <span class="poll-result-percentage">${results.yes_percentage}%</span>
        </div>
        <div class="poll-result-bar-container">
          <div class="poll-result-bar poll-result-bar-yes" style="width: ${results.yes_percentage}%"></div>
        </div>
      </div>
      <div class="poll-result-item">
        <div class="poll-result-label">
          <span>No</span>
          <span class="poll-result-percentage">${results.no_percentage}%</span>
        </div>
        <div class="poll-result-bar-container">
          <div class="poll-result-bar poll-result-bar-no" style="width: ${results.no_percentage}%"></div>
        </div>
      </div>
      <p class="poll-total-votes">${results.total_votes} vote${results.total_votes !== 1 ? 's' : ''}</p>
    `;
    
  } catch (error) {
    console.error('Failed to load poll results:', error);
    resultsContainer.innerHTML = '<p class="poll-error">Failed to load results.</p>';
  }
}

// Navigate between polls
function navigatePoll(direction) {
  const newIndex = currentPollIndex + direction;
  
  if (newIndex >= 0 && newIndex < polls.length) {
    currentPollIndex = newIndex;
    renderPoll();
  }
}

