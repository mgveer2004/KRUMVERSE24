// ============================================
// ORGANIZE TOURNAMENT SCRIPT - FINAL WORKING
// Fixes global variable conflict by using local API_BASE definition.
// ============================================

console.log('🎯 Organize Script Loading...');

// ✅ FIX: Define API_BASE locally and reliably. This ensures the fetch URL is correct 
// and avoids the global variable conflict with 'api.js'.
const API_BASE = 'http://localhost:5000/api'; 

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Organize Tournament Page Loaded');
    
    // Check access first, then load data
    if (checkOrganizerAccess()) {
        loadGamesDropdown();
        attachFormHandlers();
    }
});

// ============================================
// CHECK ORGANIZER ACCESS
// ============================================

function checkOrganizerAccess() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    // If no token or role is not organizer/admin, redirect
    if (!token || (role !== 'organizer' && role !== 'admin')) {
        showError('Access Denied: Only organizers can create tournaments');
        setTimeout(() => window.location.href = 'index.html', 2000); 
        return false;
    }
    
    return true;
}

// ============================================
// LOAD GAMES DROPDOWN (Uses local API_BASE)
// ============================================

async function loadGamesDropdown() {
    try {
        console.log('🎮 Loading games for dropdown...');
        
        // Use the reliable local API_BASE
        const endpoint = `${API_BASE}/games`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        // This check should now succeed if the backend is running
        if (!response.ok) throw new Error(`Failed to fetch games: ${response.status}`);
        
        const data = await response.json();
        
        const games = data.data || data; 
        
        if (!Array.isArray(games)) {
            throw new Error('Invalid games data received.');
        }

        populateGameDropdown(games);
        
    } catch (error) {
        console.error('❌ Error loading games:', error);
        showError('Failed to load games: ' + error.message);
    }
}

function populateGameDropdown(games) {
    const gameSelect = document.getElementById('gameSelect'); 
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
    const form = document.getElementById('tournamentForm');
    if (!form) {
        console.error('❌ Form not found');
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCreateTournament(e.submitter);
    });
}

// ============================================
// HANDLE CREATE TOURNAMENT
// ============================================

async function handleCreateTournament(submitter) {
    const form = document.getElementById('tournamentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    setButtonLoading(submitter, true);

    try {
        const formData = new FormData(form);
        const tournamentData = {
            name: formData.get('name')?.trim(),
            description: formData.get('description')?.trim(),
            gameId: formData.get('gameId'), 
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate') || null, 
            maxParticipants: parseInt(formData.get('maxParticipants')) || 16,
            registrationFee: parseFloat(formData.get('registrationFee')) || 0,
            bracket: formData.get('bracket') || 'single-elimination',
            prizePool: formData.get('prizePool')?.trim() || '',
            rules: formData.get('rules')?.trim() || ''
        };
        
        if (new Date(tournamentData.startDate) <= new Date()) {
            showError('Start date must be in the future.');
            setButtonLoading(submitter, false);
            return;
        }
        
        const token = localStorage.getItem('token');
        
        if (!token) {
             showError('Authentication failed. Please log in again.');
             setButtonLoading(submitter, false);
             return;
        }

        // Use the reliable local API_BASE for the POST request
        const apiUrl = `${API_BASE}/tournaments`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(tournamentData)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            console.error('Backend Error Response:', responseData);
            throw new Error(responseData.message || `Failed to create tournament (Status: ${response.status})`);
        }
        
        showSuccess('✅ Tournament created successfully! Redirecting...');
        
        const tournamentId = responseData.data?._id || responseData.tournament?._id;
        
        if (tournamentId) {
             setTimeout(() => {
                window.location.href = `tournament-details.html?id=${tournamentId}`;
            }, 1500);
        } else {
            setTimeout(() => {
                window.location.href = `tournament.html`;
            }, 1500);
        }
        
    } catch (error) {
        console.error('❌ Error creating tournament:', error);
        showError('Error: ' + error.message);
        setButtonLoading(submitter, false);
    }
}

// ============================================
// NOTIFICATION & LOADING HELPERS
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
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
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
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function setButtonLoading(button, loading = true) {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <span style="display: inline-block; animation: spin 1s linear infinite;">⟳</span>
      Creating...
    `;
    if (!document.getElementById('spin-animation')) {
      const style = document.createElement('style');
      style.id = 'spin-animation';
      style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || 'Create Tournament';
  }
}