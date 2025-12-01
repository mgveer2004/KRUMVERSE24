// ============================================
// HOME PAGE - UPDATED WITH API ENDPOINTS
// ============================================

window.addEventListener('DOMContentLoaded', function() {
  checkAuthStatus();
  showFABForOrganizers();
  
  document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdownMenu');
    const profileIcon = document.querySelector('.profile-icon');
    if (dropdown && profileIcon && !profileIcon.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  if (document.getElementById('tournamentsContainer')) {
    loadTournaments();
  }
  if (document.getElementById('featuredNews')) {
    loadNews();
  }
});

function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const userDataString = localStorage.getItem('user');
  const authButtons = document.getElementById('authButtons');
  const profileDropdown = document.getElementById('profileDropdown');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const createTournamentLink = document.getElementById('createTournamentLink');
  
  if (token && userDataString && userDataString !== 'undefined') {
    try {
      const user = JSON.parse(userDataString);
      
      if (authButtons) authButtons.style.display = 'none';
      if (profileDropdown) profileDropdown.style.display = 'block';
      if (usernameDisplay) usernameDisplay.textContent = user.username || 'User';
      
      if (createTournamentLink && user.role === 'organizer') {
        createTournamentLink.style.display = 'flex';
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.clear();
      if (authButtons) authButtons.style.display = 'flex';
      if (profileDropdown) profileDropdown.style.display = 'none';
    }
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (profileDropdown) profileDropdown.style.display = 'none';
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById('dropdownMenu');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

function logout() {
  localStorage.clear();
  alert('Logged out successfully!');
  window.location.href = 'index.html';
}

function showFABForOrganizers() {
  try {
    const userDataString = localStorage.getItem('user');
    const fab = document.getElementById('create-tournament-fab');
    
    if (!fab) return;
    
    if (userDataString && userDataString !== 'undefined') {
      const user = JSON.parse(userDataString);
      if (user.role === 'organizer') {
        fab.style.display = 'flex';
        console.log('✅ FAB displayed for organizer');
      } else {
        fab.style.display = 'none';
      }
    } else {
      fab.style.display = 'none';
    }
  } catch (error) {
    console.error('❌ Error showing FAB:', error);
  }
}

const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  });
}

async function loadTournaments() {
  try {
    const response = await fetch(API_ENDPOINTS.tournaments.list);
    const data = await response.json();
    const tournaments = data.data || data;
    const container = document.getElementById('tournamentsContainer');
    
    if (!container) return;
    
    if (tournaments.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No tournaments available</div>';
      return;
    }
    
    container.innerHTML = tournaments.slice(0, 3).map(tournament => `
      <div class="tournament-card" onclick="window.location.href='tournament-details.html?id=${tournament._id}'">
        <h3>${tournament.name}</h3>
        <p>${tournament.game?.name || 'Unknown Game'}</p>
        <p>${tournament.description || 'No description'}</p>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading tournaments:', error);
    const container = document.getElementById('tournamentsContainer');
    if (container) {
      container.innerHTML = '<div style="text-align: center; color: red;">Failed to load tournaments</div>';
    }
  }
}

async function loadNews() {
  try {
    const response = await fetch(API_ENDPOINTS.news);
    const news = await response.json();
    const featuredContainer = document.getElementById('featuredNews');
    
    if (!featuredContainer || !news || news.length === 0) return;
    
    const newsItem = news[0];
    featuredContainer.innerHTML = `
      <h3>${newsItem.title}</h3>
      <p>${newsItem.description || newsItem.content}</p>
    `;
    
  } catch (error) {
    console.error('Error loading news:', error);
  }
}