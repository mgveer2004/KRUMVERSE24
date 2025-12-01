// ============================================
// INDEX PAGE SCRIPT - LOAD LIVE DATA & NEWS
// ============================================

console.log('🏠 Index Script Loading...');

// API_BASE is now expected to be available globally from config/api.js

window.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOMContentLoaded - Index Page Loaded');
    
    // Load tournaments and games
    loadTournamentsSection();
    
    // Inject Dummy News Data (Matching Screenshot 2025-07-31 202849.jpg)
    loadNewsSection();
    
    // Note: checkAuthStatus is typically handled by globalauth.js now
});

// ============================================
// LOAD TOURNAMENTS SECTION (Live Data)
// ============================================

async function loadTournamentsSection() {
    console.log('🏆 Loading live tournaments for index page...');
    const container = document.getElementById('homeTournamentsGrid');
    const loadingDiv = document.getElementById('homeTournamentsLoading');

    if (!container || !loadingDiv) return;

    try {
        const apiUrl = `${API_ENDPOINTS.tournaments.list}?limit=3`; // Fetch max 3 tournaments
        loadingDiv.style.display = 'block';
        container.style.minHeight = '400px';

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        
        const data = await response.json();
        const tournaments = data.data || [];
        
        loadingDiv.style.display = 'none';
        
        if (tournaments.length > 0) {
            displayTournamentsOnIndex(tournaments, container);
        } else {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #bbb;">
                    <p>📅 No live tournaments available</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Be the first to organize one!</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Error loading tournaments:', error.message);
        loadingDiv.style.display = 'none';
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #ff6b6b;">
                <p>⚠️ Failed to load tournaments</p>
                <p style="font-size: 0.8rem;">Make sure backend is running at ${API_ENDPOINTS.tournaments.list}</p>
            </div>
        `;
    }
}

function displayTournamentsOnIndex(tournaments, container) {
    
    // Clear existing content
    container.innerHTML = '';
    
    // Display tournaments matching Screenshot 2025-07-31 202832.jpg style
    tournaments.slice(0, 3).forEach((tournament) => { // Limit to 3 for index page look
        const status = (tournament.status || 'SOON').toUpperCase();
        const statusClass = `status-${status}`;
        const fee = tournament.registrationFee > 0 ? `Fee: ₹${tournament.registrationFee}` : 'Free Entry';
        const image = tournament.game?.imageUrl || 'https://via.placeholder.com/350x180?text=Tournament';
        const players = tournament.currentParticipants || 0;
        const maxPlayers = tournament.maxParticipants || '∞';
        const prize = tournament.prizePool || tournament.prize || '$0';

        container.innerHTML += `
            <div class="tournament-card-home" onclick="window.location.href='tournament-details.html?id=${tournament._id}'">
                <div class="card-image-home">
                    <img src="${image}" alt="${tournament.name}">
                </div>
                <div class="card-content-home">
                    <span class="card-status-home ${statusClass}">${status}</span>
                    <span style="font-size: 0.9rem; color: #666; float: right;">${players}/${maxPlayers} Players</span>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin: 5px 0;">${tournament.name}</h3>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">Prize Pool: ${prize}</p>
                    
                    <a href="javascript:void(0);" style="display: block; padding: 8px; background: #667eea; color: white; border-radius: 4px; text-align: center; text-decoration: none; font-weight: 600;">
                        ${status === 'OPEN' ? 'Register' : status === 'LIVE' ? 'Join Now' : 'Coming Soon'}
                    </a>
                </div>
            </div>
        `;
    });
    
    console.log('✅ Tournaments displayed successfully');
}


// ============================================
// LOAD NEWS SECTION (Dummy Data, matching Screenshot 2025-07-31 202849.jpg)
// ============================================

function loadNewsSection() {
    const newsData = [
        {
            title: "New Gaming Gear Released",
            desc: "Latest gaming peripherals hit the market...",
            time: "4 hours ago",
            image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400"
        },
        {
            title: "Team Phoenix Wins Major",
            desc: "Incredible comeback victory in finals...",
            time: "6 hours ago",
            image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400"
        },
        {
            title: "Industry Conference 2024",
            desc: "Key announcements from leading developers...",
            time: "8 hours ago",
            image: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400"
        }
    ];

    const recentContainer = document.getElementById('recentNewsContainer');
    
    if (recentContainer) {
        recentContainer.innerHTML = newsData.map(news => `
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); color: #333; display: flex; gap: 10px; align-items: center;">
                <img src="${news.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" alt="News thumbnail" />
                <div>
                    <h4 style="font-size: 1rem; margin-bottom: 3px;">${news.title}</h4>
                    <p style="font-size: 0.8rem; color: #666;">${news.time}</p>
                </div>
            </div>
        `).join('');
    }
}