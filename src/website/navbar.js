fetch('navbar.html')
  .then(response => response.text())
  .then(html => {
    document.getElementById('navbar-container').innerHTML = html;
    initializeSearch();
  });

let searchTimeout;

function initializeSearch() {
  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-dropdown');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchDropdown || !searchResults) return;
  
  // Handle input with debouncing
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    clearTimeout(searchTimeout);
    
    // Hide dropdown if query is empty
    if (!query) {
      searchDropdown.style.display = 'none';
      return;
    }
    
    // Show loading state
    searchResults.innerHTML = '<div>Searching...</div>';
    searchDropdown.style.display = 'block';
    
    // Debounce search by 300ms
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.style.display = 'none';
    }
  });
  
  // Close dropdown on ESC key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchDropdown.style.display = 'none';
      searchInput.value = '';
    }
  });
}

async function performSearch(query) {
  const searchResults = document.getElementById('search-results');
  const searchDropdown = document.getElementById('search-dropdown');
  
  try {
    const result = await searchProfiles(query);
    
    if (!result || !result.profiles || result.profiles.length === 0) {
      searchResults.innerHTML = '<div>No users found</div>';
      return;
    }
    
    // Display search results
    searchResults.innerHTML = result.profiles.map(profile => {
      const isPrivate = profile.profile_private ? ' 🔒' : '';
      return `
        <div class="search-result-item">
          <a href="profile.html?user_id=${escapeHtml(profile.user_id)}">
            ${escapeHtml(profile.display_name)}${isPrivate}
          </a>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Search error:', error);
    searchResults.innerHTML = '<div>Search failed. Please try again.</div>';
  }
}

