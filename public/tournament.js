// ============================================
// TOURNAMENT PAGE - FRONTEND SCRIPT
// ============================================

// ✅ FIXED: Fetch tournaments from backend API
// No router reference - just fetch API endpoints

// Fetch all tournaments
async function loadTournaments() {
    try {
        console.log('📥 Fetching tournaments from API...');
        const loadingState = document.getElementById('loadingState');
        const tournamentsContainer = document.getElementById('tournamentsContainer');
        const emptyState = document.getElementById('emptyState');

        // Show loading
        if (loadingState) loadingState.style.display = 'block';
        if (tournamentsContainer) tournamentsContainer.innerHTML = '';

        // ✅ CORRECT: Fetch from backend API
        const response = await fetch('/api/tournaments', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Tournaments fetched:', data.count, 'tournaments');

        // Hide loading
        if (loadingState) loadingState.style.display = 'none';

        // Check if we have tournaments
        if (!data.success || !data.data || data.data.length === 0) {
            console.log('ℹ️ No tournaments found');
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        // Display tournaments
        displayTournaments(data.data);

    } catch (error) {
        console.error('❌ Error fetching tournaments:', error);
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'none';
            loadingState.innerHTML = '❌ Error loading tournaments: ' + error.message;
        }
    }
}

// Display tournaments in grid
function displayTournaments(tournaments) {
    const container = document.getElementById('tournamentsContainer');
    if (!container) return;

    container.innerHTML = '';

    tournaments.forEach(tournament => {
        const card = createTournamentCard(tournament);
        container.appendChild(card);
    });
}

// Create tournament card element
function createTournamentCard(tournament) {
    const card = document.createElement('div');
    card.className = 'tournament-card';
    
    // Status badge
    const statusClass = tournament.status === 'open' ? 'status-open' : 'status-closed';
    const statusBadge = `<span class="tournament-status ${statusClass}">${tournament.status.toUpperCase()}</span>`;

    // Participants progress
    const maxParticipants = tournament.maxParticipants || 16;
    const currentParticipants = tournament.currentParticipants || 0;
    const progressPercent = (currentParticipants / maxParticipants) * 100;

    // Game info
    const gameName = tournament.game?.name || 'Unknown Game';

    // Registration fee
    const registrationFee = tournament.registrationFee || 0;
    const feeDisplay = registrationFee > 0 ? `₹${registrationFee}` : 'FREE';

    // Organizer name
    const organizerName = tournament.organizer?.username || 'Unknown';

    card.innerHTML = `
        ${statusBadge}
        <h3 class="tournament-title">${tournament.name || 'Untitled Tournament'}</h3>
        
        <div class="tournament-info">
            <div class="tournament-info-row">
                <span>Game:</span>
                <strong>${gameName}</strong>
            </div>
            <div class="tournament-info-row">
                <span>Organizer:</span>
                <strong>${organizerName}</strong>
            </div>
            <div class="tournament-info-row">
                <span>Entry Fee:</span>
                <strong>${feeDisplay}</strong>
            </div>
            <div class="tournament-info-row">
                <span>Players:</span>
                <strong>${currentParticipants}/${maxParticipants}</strong>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>

        <div class="card-actions">
            <button class="btn btn-primary" onclick="joinTournament('${tournament._id}')">Join</button>
            <button class="btn btn-secondary" onclick="viewDetails('${tournament._id}')">Details</button>
        </div>
    `;

    return card;
}

// Join tournament
async function joinTournament(tournamentId) {
    try {
        console.log('📥 Joining tournament:', tournamentId);
        
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to join tournaments');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert('❌ Error: ' + (data.message || 'Could not join tournament'));
            return;
        }

        alert('✅ ' + data.message);
        loadTournaments(); // Refresh list

    } catch (error) {
        console.error('❌ Error joining:', error);
        alert('Error: ' + error.message);
    }
}

// View tournament details
function viewDetails(tournamentId) {
    console.log('📄 Opening details for:', tournamentId);
    window.location.href = `/tournament-details.html?id=${tournamentId}`;
}

// Load tournaments on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Tournament page loaded');
    loadTournaments();

    // Setup filters (optional)
    setupFilters();
});

// Setup search and filters
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterTournaments, 300));
    }
}

// Debounce helper
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Filter tournaments by search
function filterTournaments() {
    const searchValue = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const cards = document.querySelectorAll('.tournament-card');

    cards.forEach(card => {
        const title = card.querySelector('.tournament-title')?.textContent.toLowerCase() || '';
        const visible = title.includes(searchValue);
        card.style.display = visible ? 'block' : 'none';
    });
}