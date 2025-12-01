// ============================================
// PROFILE PAGE - BACKEND CONNECTED
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
  const role = localStorage.getItem('role'); // ← GET ROLE FROM LOCALSTORAGE

  console.log('👤 User from localStorage:', { username, role, user });

  if (!user || !username) {
    alert('Please login first');
    window.location.href = 'login.html';
    return; // ← ADDED MISSING CLOSING BRACE HERE!
  }

  // Set username and role
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Player';

  console.log('✅ Setting profile:', { displayName, displayRole });

  document.getElementById('profileUsername').textContent = displayName;
  document.getElementById('profileRole').textContent = displayRole;

  // Load saved profile data from localStorage
  const savedProfile = JSON.parse(localStorage.getItem('profileData') || '{}');
  document.getElementById('nickname').value = savedProfile.nickname || '';
  document.getElementById('bio').value = savedProfile.bio || '';
}

// ============================================
// LOAD TOURNAMENTS FROM BACKEND
// ============================================
async function loadUserTournaments() {
  try {
    console.log('🏆 Loading tournaments...');
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      console.warn('⚠️ No token found');
      return;
    }

    // Fetch all tournaments
    const response = await fetch('http://localhost:5000/api/tournaments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch tournaments:', response.status);
      document.getElementById('tournamentsCreated').textContent = 0;
      document.getElementById('tournamentsJoined').textContent = 0;
      return;
    }

    const tournaments = await response.json();
    console.log('📊 Tournaments received:', tournaments);

    // Count tournaments based on user role
    let created = 0;
    let joined = 0;

    tournaments.forEach(tournament => {
      // Count created tournaments (if organizer)
      if (tournament.organizer && tournament.organizer._id === user.id) {
        created++;
      }

      // Count joined tournaments
      if (tournament.participants && tournament.participants.includes(user.id)) {
        joined++;
      }
    });

    // Update UI
    document.getElementById('tournamentsCreated').textContent = created;
    document.getElementById('tournamentsJoined').textContent = joined;
    
    console.log(`✅ Tournaments loaded: ${created} created, ${joined} joined`);

  } catch (error) {
    console.error('❌ Error loading tournaments:', error);
    // Set to 0 if error
    document.getElementById('tournamentsCreated').textContent = 0;
    document.getElementById('tournamentsJoined').textContent = 0;
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

  // Save to localStorage (backend endpoint can be added later)
  localStorage.setItem('profileData', JSON.stringify(profileData));
  
  console.log('✅ Profile data saved:', profileData);
  alert('✅ Profile saved successfully!');
});
