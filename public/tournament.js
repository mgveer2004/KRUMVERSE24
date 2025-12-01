// ============================================
// TOURNAMENT PAGE - FRONTEND SCRIPT
// ============================================



let allTournaments = []; // Global store for all fetched tournaments

// ============================================
// 1. FETCH TOURNAMENTS
// ============================================
async function loadTournaments() {
    try {
        console.log('📥 Fetching tournaments from API...');
        const loadingState = document.getElementById('loadingState');
        const tournamentsContainer = document.getElementById('tournamentsContainer');
        const emptyState = document.getElementById('emptyState');

        if (loadingState) loadingState.style.display = 'block';
        if (tournamentsContainer) tournamentsContainer.innerHTML = '';
        if (emptyState) emptyState.style.display = 'none';

        // Use absolute URL
        const apiUrl = `${API_BASE_URL}/tournaments`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const tournamentList = Array.isArray(data) ? data : (data.data || []);
        
        // Store globally for filtering and modal use
        allTournaments = tournamentList; 
        
        if (loadingState) loadingState.style.display = 'none';

        if (allTournaments.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        // Load Game filter dropdown data
        await loadGameFilters(allTournaments);

        // Display all tournaments initially
        displayTournaments(allTournaments);

    } catch (error) {
        console.error('❌ Error fetching tournaments:', error);
        if (loadingState) loadingState.style.display = 'none';
        
        const container = document.getElementById('tournamentsContainer');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #ff6b6b; padding: 20px;">
                    <h3>⚠️ Could not load tournaments</h3>
                    <p>Error: ${error.message}</p>
                    <p>Make sure your Backend Server is running on port 5000!</p>
                </div>
            `;
        }
    }
}

// ============================================
// 2. DISPLAY TOURNAMENTS
// ============================================
function displayTournaments(tournaments) {
    const container = document.getElementById('tournamentsContainer');
    if (!container) return;

    container.innerHTML = '';

    tournaments.forEach(tournament => {
        const card = createTournamentCard(tournament);
        container.appendChild(card);
    });
}

// ============================================
// 3. CREATE CARD HTML (NEW LOOK)
// ============================================
function createTournamentCard(tournament) {
    const card = document.createElement('div');
    // ✅ Card Click: Now calls selectTournament which opens the modal
    card.className = 'tournament-card';
    card.onclick = () => selectTournament(tournament._id); 

    const gameImageUrl = tournament.game?.imageUrl || 'https://via.placeholder.com/300x200?text=Game+Image';
    const statusClass = `status-${tournament.status}`;
    const statusText = (tournament.status || 'draft').toUpperCase();
    
    // Date formatting helper
    const startDate = new Date(tournament.startDate);
    const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${gameImageUrl}" alt="${tournament.game?.name}">
        </div>
        <div class="card-content">
            <span class="card-game">${tournament.game?.name || 'Unknown Game'}</span>
            <h3 class="card-title">${tournament.name || 'Untitled Tournament'}</h3>
            <p class="card-description">${tournament.description || 'No description provided.'}</p>
            
            <div class="card-meta">
                <span class="card-status ${statusClass}">${statusText}</span>
                <span class="card-date">${dateStr}</span>
            </div>
        </div>
    `;

    return card;
}

// ============================================
// 4. JOIN TOURNAMENT LOGIC
// ============================================
async function joinTournament(tournamentId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to join tournaments');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert('❌ ' + (data.message || 'Could not join tournament'));
            return;
        }

        // Handle paid/free logic
        if (data.data && data.data.isPaid) {
            // Redirect to detail page to initiate payment (Razorpay handler lives there)
            window.location.href = `tournament-details.html?id=${tournamentId}`;
        } else {
            alert('✅ ' + data.message);
            loadTournaments(); // Refresh list
        }

    } catch (error) {
        console.error('❌ Error joining:', error);
        alert('Error: ' + error.message);
    }
}

// ============================================
// 5. FILTERING
// ============================================

async function loadGameFilters(tournaments) {
    const filterSelect = document.getElementById('gameFilter');
    if (!filterSelect) return;
    
    // Extract unique games
    const uniqueGames = tournaments.reduce((acc, t) => {
        if (t.game && t.game._id && !acc.some(g => g._id === t.game._id)) {
            acc.push(t.game);
        }
        return acc;
    }, []);

    uniqueGames.forEach(game => {
        const option = document.createElement('option');
        option.value = game._id;
        option.textContent = game.name;
        filterSelect.appendChild(option);
    });

    filterSelect.addEventListener('change', filterTournaments);
}

function filterTournaments() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const gameFilter = document.getElementById('gameFilter').value;
    
    const filtered = allTournaments.filter(tournament => {
        const matchesSearch = tournament.name.toLowerCase().includes(searchText) ||
                              tournament.description?.toLowerCase().includes(searchText);
        const matchesGame = !gameFilter || tournament.game?._id === gameFilter;
        return matchesSearch && matchesGame;
    });

    displayTournaments(filtered);

    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = filtered.length === 0 ? 'block' : 'none';
}


// ============================================
// 6. PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Tournament page loaded');
    loadTournaments();
    
    // Setup search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterTournaments);
    }
});

// Expose joinTournament globally so it can be called from the Modal handler in HTML
window.joinTournament = joinTournament;