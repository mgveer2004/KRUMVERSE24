// ============================================
// INDEX PAGE SCRIPT - LOAD LIVE DATA
// FETCHES TOURNAMENTS & GAMES FROM API
// ============================================

console.log('🏠 Index Script Loading...');

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE = 'http://localhost:5000/api';

const API_ENDPOINTS = {
    tournaments: {
        list: `${API_BASE}/tournaments?limit=4&skip=0`
    },
    games: {
        list: `${API_BASE}/games?limit=6&skip=0`
    }
};

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOMContentLoaded - Index Page Loaded');
    console.log('🔗 API_BASE:', API_BASE);
    
    // Load tournaments and games
    loadTournamentsSection();
    loadGamesSection();
    
    // Check authentication
    checkAuthStatus();
});

// ============================================
// AUTH CHECK
// ============================================

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    console.log('🔐 Auth Check - Token:', token ? 'Found' : 'Not Found');
    
    const loginBtn = document.querySelector('a[href="login.html"]');
    const signupBtn = document.querySelector('a[href="signup.html"]');
    
    if (token && username && loginBtn) {
        console.log('✅ User logged in:', username);
        // Optional: Add user greeting or change button to logout
        loginBtn.textContent = 'Logout';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            logout();
        };
        if (signupBtn) signupBtn.style.display = 'none';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// ============================================
// LOAD TOURNAMENTS SECTION
// ============================================

async function loadTournamentsSection() {
    console.log('🏆 Loading tournaments for index page...');
    
    try {
        const endpoint = API_ENDPOINTS.tournaments.list;
        console.log('📤 Fetching from:', endpoint);
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Response Data:', data);
        
        // Handle multiple response formats
        let tournaments = [];
        
        if (data.success && Array.isArray(data.data)) {
            tournaments = data.data;
            console.log('✅ Format: data.success && data.data is array');
        } else if (Array.isArray(data.data)) {
            tournaments = data.data;
            console.log('✅ Format: data.data is array');
        } else if (Array.isArray(data)) {
            tournaments = data;
            console.log('✅ Format: data itself is array');
        } else if (data.tournaments && Array.isArray(data.tournaments)) {
            tournaments = data.tournaments;
            console.log('✅ Format: data.tournaments is array');
        }
        
        console.log('✅ Found', tournaments.length, 'tournaments');
        
        if (tournaments.length > 0) {
            displayTournamentsOnIndex(tournaments);
        } else {
            console.log('⚠️ No tournaments found');
            displayEmptyTournaments();
        }
        
    } catch (error) {
        console.error('❌ Error loading tournaments:', error.message);
        displayTournamentError(error.message);
    }
}

function displayTournamentsOnIndex(tournaments) {
    const container = document.querySelector('.tournaments-scroll');
    
    if (!container) {
        console.error('❌ tournaments-scroll container not found');
        return;
    }
    
    console.log('🎮 Displaying', tournaments.length, 'tournaments');
    
    // Clear existing demo content
    container.innerHTML = '';
    
    // Display tournaments
    tournaments.forEach((tournament) => {
        const status = determineStatus(tournament);
        const card = createTournamentCard(tournament, status);
        container.appendChild(card);
    });
    
    console.log('✅ Tournaments displayed successfully');
}

function createTournamentCard(tournament, status) {
    const card = document.createElement('div');
    card.className = 'tournament-card';
    
    const statusClass = status === 'LIVE' ? 'status-live' : 
                       status === 'OPEN' ? 'status-open' : 'status-soon';
    
    card.innerHTML = `
        <img src="https://images.unsplash.com/photo-1578633769512-09cff66b1e6e?w=400&h=250&fit=crop" 
             alt="${tournament.name}" class="tournament-image">
        <div class="tournament-info">
            <span class="tournament-status ${statusClass}">${status}</span>
            <p class="tournament-players">${tournament.participants || tournament.maxParticipants || 'N/A'} Players</p>
            <h3 class="tournament-name">${tournament.name}</h3>
            <p class="tournament-prize">Prize Pool: $${tournament.prizePool || tournament.prize || '0'}</p>
            <button class="tournament-action" 
                    onclick="window.location.href='tournament-details.html?id=${tournament._id || tournament.id || ''}'">
                ${status === 'SOON' ? 'Coming Soon' : status === 'OPEN' ? 'Register' : 'Join Now'}
            </button>
        </div>
    `;
    
    return card;
}

function determineStatus(tournament) {
    if (!tournament) return 'SOON';
    
    // Check tournament status field if it exists
    if (tournament.status) {
        return tournament.status.toUpperCase();
    }
    
    // Fallback logic based on dates
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    if (now < startDate) return 'SOON';
    if (now > endDate) return 'CLOSED';
    return 'LIVE';
}

function displayEmptyTournaments() {
    const container = document.querySelector('.tournaments-scroll');
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--gray-text);">
                <p>📅 No tournaments currently available</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Check back soon for exciting tournaments!</p>
            </div>
        `;
    }
}

function displayTournamentError(errorMessage) {
    const container = document.querySelector('.tournaments-scroll');
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--gray-text);">
                <p>⚠️ Unable to load tournaments</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem; color: #ff6b6b;">${errorMessage}</p>
                <p style="font-size: 0.8rem; margin-top: 1rem;">Make sure backend is running at ${API_BASE}</p>
            </div>
        `;
    }
}

// ============================================
// LOAD GAMES SECTION (Optional for Index)
// ============================================

async function loadGamesSection() {
    console.log('🎮 Loading games for index page...');
    
    try {
        const endpoint = API_ENDPOINTS.games.list;
        console.log('📤 Fetching from:', endpoint);
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Games Data:', data);
        
        // Handle response format
        let games = [];
        
        if (Array.isArray(data.data)) {
            games = data.data;
        } else if (Array.isArray(data.games)) {
            games = data.games;
        } else if (Array.isArray(data)) {
            games = data;
        }
        
        console.log('✅ Found', games.length, 'games');
        
        // You can add game display logic here if needed
        
    } catch (error) {
        console.error('❌ Error loading games:', error.message);
        // Games are optional for index, so don't show error
    }
}

// ============================================
// REFRESH DATA BUTTON (Optional)
// ============================================

window.refreshIndexData = function() {
    console.log('🔄 Refreshing index data...');
    loadTournamentsSection();
    loadGamesSection();
};

console.log('✅ Index Script Loaded Successfully');