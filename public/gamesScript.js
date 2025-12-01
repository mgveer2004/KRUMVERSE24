// ============================================
// GAMES SCRIPT - FINAL FIXED VERSION
// NO DUPLICATE API_ENDPOINTS DECLARATION
// ============================================

console.log('🎮 Games Script Loading...');

let allGames = [];
let currentGame = null;
let userRole = null;

// ============================================
// CHECK IF API_ENDPOINTS ALREADY EXISTS
// (Shared with globalauth.js)
// ============================================

if (typeof API_ENDPOINTS === 'undefined') {
  console.log('⚠️ API_ENDPOINTS not defined, defining now...');
  const API_BASE = 'http://localhost:5000/api';
  window.API_ENDPOINTS = {
    auth: {
      signup: `${API_BASE}/auth/signup`,
      login: `${API_BASE}/auth/login`,
      verifyEmail: `${API_BASE}/auth/verify-email`,
      resendVerification: `${API_BASE}/auth/resend-verification`,
    },
    games: {
      list: `${API_BASE}/games`,
      get: (id) => `${API_BASE}/games/${id}`,
      create: `${API_BASE}/games`,
      update: (id) => `${API_BASE}/games/${id}`,
      delete: (id) => `${API_BASE}/games/${id}`
    }
  };
} else {
  console.log('✅ API_ENDPOINTS already defined (from globalauth.js)');
}

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOMContentLoaded - Games Page Loaded');
  console.log('🔗 API_ENDPOINTS:', window.API_ENDPOINTS);
  
  // Check auth and load games
  checkAuthStatus();
  getUserRoleFromStorage();
  fetchGames();
  
  // Setup search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
});

// ============================================
// AUTHENTICATION
// ============================================

function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  console.log('🔐 Auth Check - Token:', token ? 'Found' : 'Not Found');
  
  const authLink = document.getElementById('authLink');
  const signupLink = document.getElementById('signupLink');
  
  if (token && username && authLink && signupLink) {
    authLink.textContent = 'Logout';
    authLink.href = '#';
    authLink.onclick = (e) => {
      e.preventDefault();
      logout();
    };
    signupLink.style.display = 'none';
  }
}

function getUserRoleFromStorage() {
  const userDataString = localStorage.getItem('user');
  if (userDataString) {
    try {
      const userData = JSON.parse(userDataString);
      userRole = userData.role;
      console.log('👤 User Role:', userRole);
    } catch (e) {
      console.error('❌ Error parsing user data:', e);
      userRole = 'guest';
    }
  } else {
    userRole = 'guest';
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// ============================================
// FETCH GAMES FROM API
// ============================================

async function fetchGames() {
  const loadingState = document.getElementById('loadingState');
  const gamesGrid = document.getElementById('gamesGrid');
  const emptyState = document.getElementById('emptyState');
  
  try {
    if (loadingState) loadingState.style.display = 'block';
    
    const endpoint = window.API_ENDPOINTS.games.list;
    console.log('📤 Fetching games from:', endpoint);
    
    const response = await fetch(endpoint);
    
    console.log('📊 Response Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 Response Data:', data);
    
    // ✅ Handle both array and object responses
    if (Array.isArray(data)) {
      allGames = data;
      console.log('✅ Games is Array:', allGames.length, 'games');
    } else if (data && Array.isArray(data.games)) {
      allGames = data.games;
      console.log('✅ Games is Object with games property:', allGames.length, 'games');
    } else if (data && Array.isArray(data.data)) {
      allGames = data.data;
      console.log('✅ Games is Object with data property:', allGames.length, 'games');
    } else {
      console.error('❌ Unexpected data format:', data);
      allGames = [];
    }
    
    if (loadingState) loadingState.style.display = 'none';
    
    if (allGames.length === 0) {
      console.log('⚠️ No games found');
      if (emptyState) emptyState.style.display = 'block';
      if (gamesGrid) gamesGrid.innerHTML = '';
    } else {
      console.log('✅ Displaying', allGames.length, 'games');
      displayGames(allGames);
    }
    
  } catch (error) {
    console.error('❌ Error loading games:', error.message);
    console.error('Full error:', error);
    
    if (loadingState) loadingState.style.display = 'none';
    
    if (gamesGrid) {
      gamesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
          <h3>❌ Failed to load games</h3>
          <p>Error: ${error.message}</p>
          <p>Make sure backend is running at http://localhost:5000</p>
          <button onclick="location.reload()" style="
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
          ">Retry</button>
        </div>
      `;
    }
  }
}

// ============================================
// DISPLAY GAMES
// ============================================

function displayGames(games) {
  const gamesGrid = document.getElementById('gamesGrid');
  
  if (!gamesGrid) {
    console.error('❌ gamesGrid element not found');
    return;
  }
  
  if (!Array.isArray(games)) {
    console.error('❌ games is not an array:', typeof games);
    return;
  }
  
  console.log('🎮 Displaying', games.length, 'games');
  
  gamesGrid.innerHTML = games.map(game => `
    <div class="game-card" onclick="selectGame('${game._id || game.id}')">
      <div class="game-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <span style="font-size: 40px;">🎮</span>
      </div>
      <h3>${game.name || 'Unknown Game'}</h3>
      <p>${game.description || 'No description'}</p>
      <div class="game-details">
        <span>💰 ${game.entryFee || 0} Credits</span>
        <span>👥 ${game.maxPlayers || 0} Players</span>
      </div>
      <button class="btn-play">Play Now</button>
    </div>
  `).join('');
}

// ============================================
// SEARCH GAMES
// ============================================

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  console.log('🔍 Searching for:', searchTerm);
  
  if (searchTerm === '') {
    displayGames(allGames);
  } else {
    const filtered = allGames.filter(game => 
      (game.name && game.name.toLowerCase().includes(searchTerm)) ||
      (game.description && game.description.toLowerCase().includes(searchTerm))
    );
    
    console.log('🔍 Found', filtered.length, 'results');
    displayGames(filtered);
  }
}

// ============================================
// SELECT GAME
// ============================================

function selectGame(gameId) {
  console.log('🎮 Selected game:', gameId);
  
  currentGame = allGames.find(g => (g._id || g.id) === gameId);
  
  if (currentGame) {
    console.log('✅ Current Game:', currentGame);
    // You can add logic here to redirect or show game details
  } else {
    console.error('❌ Game not found:', gameId);
  }
}