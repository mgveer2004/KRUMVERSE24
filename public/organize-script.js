// ============================================
// ORGANIZE TOURNAMENT SCRIPT - COMPLETE & FIXED
// Handles form submission, tournament creation, and proper registration fee handling
// ============================================

console.log('🎯 Organize Script Loading...');

const API_BASE = 'http://localhost:5000/api';
let preSelectedGameId = null;
let preSelectedGameName = null;

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Organize Tournament Page Loaded');
    checkOrganizerAccess();
    loadGamesDropdown();
    attachFormHandlers();
});

// ============================================
// CHECK ORGANIZER ACCESS
// ============================================

function checkOrganizerAccess() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log('🔐 Access Check - Role:', role, 'Token:', token ? 'Found' : 'Not Found');
    
    if (!token) {
        showError('Please login first');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return false;
    }
    
    if (role !== 'organizer' && role !== 'admin') {
        showError('Only organizers can create tournaments');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return false;
    }
    
    console.log('✅ Organizer access confirmed');
    return true;
}

// ============================================
// LOAD GAMES DROPDOWN
// ============================================

async function loadGamesDropdown() {
    try {
        console.log('🎮 Loading games for dropdown...');
        
        const response = await fetch(`${API_BASE}/games`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Failed to fetch games');
        
        const data = await response.json();
        console.log('✅ Games loaded:', data);
        
        let games = [];
        if (data.data && Array.isArray(data.data)) {
            games = data.data;
        } else if (Array.isArray(data)) {
            games = data;
        }
        
        populateGameDropdown(games);
        
    } catch (error) {
        console.error('❌ Error loading games:', error);
        showError('Failed to load games: ' + error.message);
    }
}

function populateGameDropdown(games) {
    const gameSelect = document.getElementById('gameId');
    if (!gameSelect) return;
    
    gameSelect.innerHTML = '<option value="">-- Select a Game --</option>';
    
    games.forEach(game => {
        const option = document.createElement('option');
        option.value = game._id;
        option.textContent = game.name;
        gameSelect.appendChild(option);
    });
    
    console.log('✅ Game dropdown populated with', games.length, 'games');
}

// ============================================
// ATTACH FORM HANDLERS
// ============================================

function attachFormHandlers() {
    const form = document.getElementById('createTournamentForm');
    if (!form) {
        console.error('❌ Form not found');
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCreateTournament();
    });
    
    console.log('✅ Form handlers attached');
}

// ============================================
// HANDLE CREATE TOURNAMENT
// ============================================

async function handleCreateTournament() {
    try {
        console.log('🏆 Creating tournament...');
        
        // Get form data
        const formData = new FormData(document.getElementById('createTournamentForm'));
        const tournamentData = {
            name: formData.get('name')?.trim(),
            description: formData.get('description')?.trim(),
            gameId: formData.get('gameId'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            maxParticipants: parseInt(formData.get('maxParticipants')) || 16,
            registrationFee: parseFloat(formData.get('registrationFee')) || 0,
            bracket: formData.get('bracket') || 'single-elimination',
            prizePool: formData.get('prizePool')?.trim() || '',
            rules: formData.get('rules')?.trim() || ''
        };
        
        console.log('📝 Tournament Data:', tournamentData);
        
        // Validate required fields
        if (!tournamentData.name) {
            showError('Tournament name is required');
            return;
        }
        if (!tournamentData.gameId) {
            showError('Please select a game');
            return;
        }
        if (!tournamentData.startDate) {
            showError('Start date is required');
            return;
        }
        if (tournamentData.registrationFee < 0) {
            showError('Registration fee cannot be negative');
            return;
        }
        
        // ✅ Log the registration fee to verify it's being sent
        console.log('💰 Registration Fee:', tournamentData.registrationFee);
        
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE}/tournaments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(tournamentData)
        });
        
        const responseData = await response.json();
        console.log('📤 Create Response:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to create tournament');
        }
        
        console.log('✅ Tournament created:', responseData.tournament._id);
        
        showSuccess('✅ Tournament created successfully!');
        
        // Redirect to tournament details
        const tournamentId = responseData.tournament._id;
        setTimeout(() => {
            window.location.href = `tournament-details.html?id=${tournamentId}`;
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error creating tournament:', error);
        showError('Error: ' + error.message);
    }
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

function showError(message) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9998;
        max-width: 300px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => div.remove(), 300);
    }, 4000);
}

function showSuccess(message) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9998;
        max-width: 300px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function showInfo(message) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3498db;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9998;
        max-width: 300px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('✅ Organize Script Ready');