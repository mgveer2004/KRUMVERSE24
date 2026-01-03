// ============================================
// GLOBAL AUTHENTICATION CHECK
// Runs on every page to update UI based on login status
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkGlobalAuth();
});

function checkGlobalAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Elements to toggle
    const authButtons = document.getElementById('authButtons'); // Login/Signup container
    const profileDropdown = document.getElementById('profileDropdown'); // User avatar area
    const usernameDisplay = document.getElementById('usernameDisplay');

    if (token && user) {
        // User IS logged in
        if (authButtons) authButtons.style.display = 'none';
        if (profileDropdown) profileDropdown.style.display = 'flex'; // or 'block'
        if (usernameDisplay) usernameDisplay.textContent = user.username || 'Player';
        
        // Show "Organizer" specific buttons if applicable
        if (user.role === 'organizer' || user.role === 'admin') {
            const createBtn = document.getElementById('createTournamentLink');
            if (createBtn) createBtn.style.display = 'flex';
        }
    } else {
        // User is NOT logged in
        if (authButtons) authButtons.style.display = 'flex';
        if (profileDropdown) profileDropdown.style.display = 'none';
    }
}

// Global Logout Function
function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}