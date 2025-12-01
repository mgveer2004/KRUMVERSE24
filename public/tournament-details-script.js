// ============================================
// TOURNAMENT DETAILS - COMPLETE DISPLAY
// Shows ALL tournament info including fees, description, rules
// ============================================

const RAZORPAY_KEY_ID = 'rzp_test_Rdc0o3XDNefwT7';
let currentTournament = null;
let currentUser = null;

window.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Tournament Details Page Loaded');
    loadCurrentUser();
    
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id');
    
    console.log('📍 Tournament ID from URL:', tournamentId);
    
    if (!tournamentId) {
        console.error('❌ No tournament ID provided');
        alert('Invalid tournament ID');
        window.location.href = 'tournament.html';
        return;
    }
    
    loadTournamentDetails(tournamentId);
});

function loadCurrentUser() {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
        try {
            currentUser = JSON.parse(userDataString);
            console.log('👤 Current user:', currentUser.username);
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
}

async function loadTournamentDetails(tournamentId) {
    try {
        const url = `http://localhost:5000/api/tournaments/${tournamentId}`;
        console.log('🔗 Fetching from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch tournament: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('✅ Tournament loaded:', responseData);
        
        if (responseData.success && responseData.data) {
            currentTournament = responseData.data;
            console.log('✅ Tournament ready:', currentTournament.name);
            displayTournamentDetails();
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        console.error('❌ Error loading tournament:', error);
        alert('Failed to load tournament details');
        window.location.href = 'tournament.html';
    }
}

function displayTournamentDetails() {
    try {
        const tournament = currentTournament;
        
        if (!tournament) {
            console.error('❌ No tournament data available');
            return;
        }
        
        // Tournament Name
        const nameEl = document.getElementById('tournamentName');
        if (nameEl) nameEl.textContent = tournament.name || 'Unknown';
        
        // Game
        const gameEl = document.getElementById('tournamentGame');
        if (gameEl) gameEl.textContent = tournament.game?.name || 'Unknown Game';
        
        // Organizer
        const organizerEl = document.getElementById('organizer');
        if (organizerEl) organizerEl.textContent = tournament.organizer?.username || 'Unknown Organizer';
        
        // Status
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = (tournament.status || 'unknown').toUpperCase();
        
        // Description
        const descEl = document.getElementById('description');
        if (descEl) descEl.textContent = tournament.description || 'No description provided';
        
        // Rules
        const rulesEl = document.getElementById('rules');
        if (rulesEl) rulesEl.textContent = tournament.rules || 'No rules specified';
        
        // Prize Pool
        const prizeEl = document.getElementById('prizePool');
        if (prizeEl) prizeEl.textContent = tournament.prizePool || 'Not specified';
        
        // ✅ REGISTRATION FEE (NEW - THIS WAS MISSING!)
        const registrationFeeEl = document.getElementById('registrationFee');
        if (registrationFeeEl) {
            if (tournament.registrationFee && tournament.registrationFee > 0) {
                registrationFeeEl.textContent = `₹${tournament.registrationFee}`;
            } else {
                registrationFeeEl.textContent = 'FREE';
            }
        }
        
        // Participants
        const participantCount = tournament.participants?.length || 0;
        const participantCountEl = document.getElementById('participantCount');
        if (participantCountEl) participantCountEl.textContent = participantCount;
        
        // Max Participants
        const maxParticipantsEl = document.getElementById('maxParticipants');
        if (maxParticipantsEl) maxParticipantsEl.textContent = tournament.maxParticipants || 'Unlimited';
        
        // Start Date
        if (tournament.startDate) {
            const date = new Date(tournament.startDate);
            const startDateEl = document.getElementById('startDate');
            if (startDateEl) startDateEl.textContent = date.toLocaleString();
        }
        
        console.log('✅ Tournament details displayed');
        
    } catch (error) {
        console.error('❌ Error displaying tournament details:', error);
    }
}