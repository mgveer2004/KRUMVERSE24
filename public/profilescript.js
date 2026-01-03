// ============================================
// PROFILE PAGE - BACKEND CONNECTED - FIXED
// ============================================
window.addEventListener('DOMContentLoaded', function() {
  loadProfile();
  loadUserTournaments();
});

// ============================================
// LOAD BASIC PROFILE INFO
// ============================================
function loadProfile() {
  console.log('📝 Loading profile...');
  
  const user = JSON.parse(localStorage.getItem('user'));
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  if (!user || !username) {
    alert('Please login first');
    window.location.href = 'login.html';
    return;
  }

  // Set username and role
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Player';

  document.getElementById('profileUsername').textContent = displayName;
  document.getElementById('profileRole').textContent = displayRole;
  document.getElementById('profileEmail').value = user.email || 'N/A'; // Display email

  // Load saved profile data from localStorage
  const savedProfile = JSON.parse(localStorage.getItem('profileData') || '{}');
  document.getElementById('nickname').value = savedProfile.nickname || '';
  document.getElementById('bio').value = savedProfile.bio || '';
}

// ============================================
// LOAD TOURNAMENTS FROM BACKEND - FIXED LOGIC
// ============================================
async function loadUserTournaments() {
  try {
    console.log('🏆 Loading tournaments...');
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) return;

    const response = await fetch('http://localhost:5000/api/tournaments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch tournaments:', response.status);
      return;
    }

    const data = await response.json();
    const tournaments = data.data || [];
    
    let created = 0;
    let joined = 0;

    tournaments.forEach(tournament => {
      // Count created tournaments (Check if organizer ID matches current user ID)
      if (tournament.organizer && tournament.organizer._id === user.id) {
        created++;
      }

      // 🚨 FIXED LOGIC: Use .some() to check if the user exists in the participants array
      const isJoined = tournament.participants.some(p => p.user?._id === user.id);
      if (isJoined) {
        joined++;
      }
    });

    // Update UI
    document.getElementById('tournamentsCreated').textContent = created;
    document.getElementById('tournamentsJoined').textContent = joined;
    
    // Show/Hide Organizer specific stat box
    document.getElementById('statCreated').style.display = user.role === 'organizer' || user.role === 'admin' ? 'block' : 'none';

  } catch (error) {
    console.error('❌ Error loading tournaments:', error);
  }
}

// ============================================
// SAVE PROFILE (BIO & NICKNAME)
// ============================================
document.getElementById('profileForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const profileData = {
    nickname: document.getElementById('nickname').value,
    bio: document.getElementById('bio').value
  };

  // Save to localStorage
  localStorage.setItem('profileData', JSON.stringify(profileData));
  
  alert('✅ Profile saved successfully!');
});