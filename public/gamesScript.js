// ============================================
// GAMES SCRIPT - FINAL FIXED VERSION
// Handles fetching, card generation, and modal display
// ============================================

console.log('🎮 Games Script Loading...');

let allGames = [];
let userRole = null;

// ============================================
// CHECK IF API_ENDPOINTS ALREADY EXISTS
// (Safe initialization without needing to define API_ENDPOINTS here)
// ============================================

window.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOMContentLoaded - Games Page Loaded');
    
    // Check auth and load games
    getUserRoleFromStorage();
    fetchGames();
    
    // Setup search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});

function getUserRoleFromStorage() {
    // This part ensures globalauth.js has run
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            userRole = userData.role;
        } catch (e) {
            userRole = 'guest';
        }
    } else {
        userRole = 'guest';
    }
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
        if (gamesGrid) gamesGrid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'none';
        
        // Get endpoint from global config or default
        const endpoint = (window.API_ENDPOINTS && window.API_ENDPOINTS.games) 
            ? window.API_ENDPOINTS.games.list 
            : 'http://localhost:5000/api/games';

        console.log('📤 Fetching games from:', endpoint);
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle response: data.data or data array
        const gamesArray = Array.isArray(data) ? data : (data.data || []);
        allGames = gamesArray.filter(game => game.isActive !== false); // Filter out inactive games
        
        if (loadingState) loadingState.style.display = 'none';
        
        if (allGames.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            displayGames(allGames);
        }
        
    } catch (error) {
        console.error('❌ Error loading games:', error.message);
        
        if (loadingState) loadingState.style.display = 'none';
        
        if (gamesGrid) {
            gamesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff6b6b;">
                    <h3>❌ Failed to load games</h3>
                    <p>Error: ${error.message}</p>
                    <p>Make sure backend is running at http://localhost:5000</p>
                </div>
            `;
        }
    }
}

// ============================================
// DISPLAY GAMES - GENERATES NEW CARD HTML
// ============================================

function displayGames(games) {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid || !Array.isArray(games)) return;
    
    gamesGrid.innerHTML = games.map(game => `
        <div class="game-card" onclick="selectGame('${game._id}')">
            <div class="card-image">
                <img src="${game.imageUrl || 'https://via.placeholder.com/300x200?text=Game+Image'}" alt="${game.name}">
            </div>
            <div class="card-content">
                <p class="card-genre">${game.category || game.genre || 'Esports'}</p>
                <h3 class="card-title">${game.name || 'Unknown Game'}</h3>
                <p class="card-description">${game.description || 'No description provided.'}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// SEARCH GAMES
// ============================================

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        displayGames(allGames);
    } else {
        const filtered = allGames.filter(game => 
            (game.name && game.name.toLowerCase().includes(searchTerm)) ||
            (game.description && game.description.toLowerCase().includes(searchTerm))
        );
        
        displayGames(filtered);
        
        const emptyState = document.getElementById('emptyState');
        const gamesGrid = document.getElementById('gamesGrid');
        
        if (filtered.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (gamesGrid) gamesGrid.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (gamesGrid) gamesGrid.style.display = 'grid';
        }
    }
}