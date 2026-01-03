// Games Page Logic
let allGames = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchGames();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});

async function fetchGames() {
    const ui = {
        grid: document.getElementById('gamesGrid'),
        loading: document.getElementById('loadingState'),
        empty: document.getElementById('emptyState')
    };

    try {
        if (ui.loading) ui.loading.style.display = 'block';
        if (ui.empty) ui.empty.style.display = 'none';

        // Use the global config
        const response = await fetch(API_ENDPOINTS.games);
        
        if (!response.ok) throw new Error('Failed to fetch games');
        
        const data = await response.json();
        const gamesArray = Array.isArray(data) ? data : (data.data || []);
        
        // Filter out hidden/inactive games if your model supports it
        allGames = gamesArray.filter(g => g.isActive !== false);

        displayGames(allGames);

    } catch (error) {
        console.error('Games Load Error:', error);
        if (ui.grid) {
            ui.grid.innerHTML = `<div class="error-state">Unable to load games. Please try again later.</div>`;
        }
    } finally {
        if (ui.loading) ui.loading.style.display = 'none';
        if (allGames.length === 0 && ui.empty) ui.empty.style.display = 'block';
    }
}

function displayGames(games) {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;

    if (games.length === 0) {
        grid.style.display = 'none';
        const empty = document.getElementById('emptyState');
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = games.map(game => `
        <div class="game-card" onclick="selectGame('${game._id}')">
            <div class="card-image">
                <img src="${game.imageUrl || 'assets/images/game-placeholder.jpg'}" alt="${game.name}" loading="lazy">
            </div>
            <div class="card-content">
                <span class="card-genre">${game.category || 'Esports'}</span>
                <h3 class="card-title">${game.name}</h3>
                <p class="card-description">${game.description || 'Join the battle in this exciting tournament.'}</p>
            </div>
        </div>
    `).join('');
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allGames.filter(game => 
        (game.name && game.name.toLowerCase().includes(term)) ||
        (game.category && game.category.toLowerCase().includes(term))
    );
    displayGames(filtered);
}

// Function to handle card click
function selectGame(gameId) {
    // Save selection or redirect
    console.log('Selected Game:', gameId);
    // window.location.href = `organize-tournament.html?gameId=${gameId}`;
}