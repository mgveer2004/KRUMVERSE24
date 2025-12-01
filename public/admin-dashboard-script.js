// ============================================
// ADMIN DASHBOARD SCRIPT - COMPLETE & WORKING
// ============================================

console.log('🎯 Admin Dashboard Loading...');

let currentTab = 'dashboard';
let adminData = {
    stats: null,
    games: [],
    users: [],
    tournaments: [],
    transactions: []
};

// ============================================
// CHECK ADMIN ACCESS ON PAGE LOAD
// ============================================

window.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Admin Dashboard Page Loaded');
    checkAdminAccess();
    loadDashboardStats();
    setupTabNavigation();
});

// ============================================
// CHECK IF USER IS ADMIN
// ============================================

function checkAdminAccess() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    console.log('🔐 Admin Check - Role:', userRole, 'Token:', token ? 'Found' : 'Not Found');
    
    if (userRole !== 'admin') {
        console.log('❌ Not admin, redirecting...');
        showError('Access Denied! Admin only.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }
    
    console.log('✅ Admin access confirmed');
    return true;
}

// ============================================
// SETUP TAB NAVIGATION
// ============================================

function setupTabNavigation() {
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            console.log('📑 Switching tab:', tabName);
            switchTab(tabName);
        });
    });
}

// ============================================
// SWITCH TABS
// ============================================

function switchTab(tabName) {
    currentTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('[id^="tab-"]').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Update active button
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Load data for this tab
    switch(tabName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'games':
            loadGames();
            break;
        case 'users':
            loadUsers();
            break;
        case 'tournaments':
            loadTournaments();
            break;
        case 'payments':
            loadTransactions();
            break;
    }
}

// ============================================
// LOAD DASHBOARD STATS
// ============================================

async function loadDashboardStats() {
    const container = document.getElementById('dashboardStats');
    if (!container) return;
    
    try {
        showLoading('Loading statistics...');
        
        const response = await fetch('http://localhost:5000/api/admin/stats/dashboard', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load stats');
        
        const data = await response.json();
        adminData.stats = data.data;
        
        console.log('✅ Stats loaded:', adminData.stats);
        
        // Display stats
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0;">
                <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; border-left: 4px solid #3498db;">
                    <h3 style="margin: 0; color: #3498db;">👥 Total Users</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 10px 0 0 0; color: #2c3e50;">${data.data.users?.total || 0}</p>
                </div>
                
                <div style="background: #f0fff0; padding: 20px; border-radius: 10px; border-left: 4px solid #27ae60;">
                    <h3 style="margin: 0; color: #27ae60;">🎮 Total Games</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 10px 0 0 0; color: #2c3e50;">${data.data.games?.total || 0}</p>
                </div>
                
                <div style="background: #fff9f0; padding: 20px; border-radius: 10px; border-left: 4px solid #e67e22;">
                    <h3 style="margin: 0; color: #e67e22;">🏆 Total Tournaments</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 10px 0 0 0; color: #2c3e50;">${data.data.tournaments?.total || 0}</p>
                </div>
                
                <div style="background: #fff0f5; padding: 20px; border-radius: 10px; border-left: 4px solid #e74c3c;">
                    <h3 style="margin: 0; color: #e74c3c;">💳 Total Revenue</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 10px 0 0 0; color: #2c3e50;">₹${data.data.payments?.totalRevenue || 0}</p>
                </div>
                
                <div style="background: #f5f0ff; padding: 20px; border-radius: 10px; border-left: 4px solid #9b59b6;">
                    <h3 style="margin: 0; color: #9b59b6;">📊 Active Tournaments</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 10px 0 0 0; color: #2c3e50;">${data.data.tournaments?.active || 0}</p>
                </div>
                
                <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; border-left: 4px solid #16a085;">
                    <h3 style="margin: 0; color: #16a085;">✅ Successful Payments</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 10px 0 0 0; color: #2c3e50;">${data.data.payments?.successful || 0}</p>
                </div>
            </div>
        `;
        
        hideLoading();
        showSuccess('Statistics loaded!');
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        showError('Failed to load statistics: ' + error.message);
    }
}

// ============================================
// LOAD GAMES
// ============================================

async function loadGames() {
    const container = document.getElementById('gamesList');
    if (!container) return;
    
    try {
        showLoading('Loading games...');
        
        const response = await fetch('http://localhost:5000/api/admin/games', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load games');
        
        const data = await response.json();
        adminData.games = data.data || [];
        
        console.log('✅ Games loaded:', adminData.games.length);
        
        if (adminData.games.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">No games found. Create one!</p>';
        } else {
            container.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #ecf0f1; border-bottom: 2px solid #bdc3c7;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Game Name</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Category</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Status</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.games.map(game => `
                            <tr style="border-bottom: 1px solid #ecf0f1;">
                                <td style="padding: 12px; border: 1px solid #ecf0f1;"><strong>${game.name || 'N/A'}</strong></td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">${game.category || 'Other'}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">
                                    <span style="background: ${game.isActive ? '#d4edda' : '#f8d7da'}; color: ${game.isActive ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 4px;">
                                        ${game.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">
                                    <button onclick="editGame('${game._id}')" style="background: #3498db; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">Edit</button>
                                    <button onclick="deleteGame('${game._id}')" style="background: #e74c3c; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        hideLoading();
        showSuccess(`${adminData.games.length} games loaded!`);
        
    } catch (error) {
        console.error('❌ Error loading games:', error);
        showError('Failed to load games: ' + error.message);
    }
}

// ============================================
// LOAD USERS
// ============================================

async function loadUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    try {
        showLoading('Loading users...');
        
        const response = await fetch('http://localhost:5000/api/admin/users', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load users');
        
        const data = await response.json();
        adminData.users = data.data || [];
        
        console.log('✅ Users loaded:', adminData.users.length);
        
        if (adminData.users.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">No users found.</p>';
        } else {
            container.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #ecf0f1; border-bottom: 2px solid #bdc3c7;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Username</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Email</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Role</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Verified</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Joined</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.users.map(user => `
                            <tr style="border-bottom: 1px solid #ecf0f1;">
                                <td style="padding: 12px; border: 1px solid #ecf0f1;"><strong>${user.username}</strong></td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">${user.email}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">
                                    <span style="background: ${user.role === 'admin' ? '#c0392b' : user.role === 'organizer' ? '#2980b9' : '#27ae60'}; color: white; padding: 4px 8px; border-radius: 4px;">
                                        ${user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">
                                    <span style="color: ${user.emailVerified ? '#27ae60' : '#e74c3c'};">
                                        ${user.emailVerified ? '✓ Yes' : '✗ No'}
                                    </span>
                                </td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">${new Date(user.createdAt).toLocaleDateString()}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">
                                    <button onclick="deleteUser('${user._id}')" style="background: #e74c3c; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        hideLoading();
        showSuccess(`${adminData.users.length} users loaded!`);
        
    } catch (error) {
        console.error('❌ Error loading users:', error);
        showError('Failed to load users: ' + error.message);
    }
}

// ============================================
// LOAD TOURNAMENTS
// ============================================

async function loadTournaments() {
    const container = document.getElementById('tournamentsList');
    if (!container) return;
    
    try {
        showLoading('Loading tournaments...');
        
        const response = await fetch('http://localhost:5000/api/admin/tournaments', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load tournaments');
        
        const data = await response.json();
        adminData.tournaments = data.data || [];
        
        console.log('✅ Tournaments loaded:', adminData.tournaments.length);
        
        if (adminData.tournaments.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">No tournaments found.</p>';
        } else {
            container.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #ecf0f1; border-bottom: 2px solid #bdc3c7;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Tournament Name</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Organizer</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Status</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Participants</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Prize Pool</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.tournaments.map(tournament => `
                            <tr style="border-bottom: 1px solid #ecf0f1;">
                                <td style="padding: 12px; border: 1px solid #ecf0f1;"><strong>${tournament.name}</strong></td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">${tournament.organizer?.username || 'N/A'}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">
                                    <span style="background: ${getStatusColor(tournament.status)}; color: white; padding: 4px 8px; border-radius: 4px;">
                                        ${tournament.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">${tournament.currentParticipants || 0}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">${tournament.prizePool || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        hideLoading();
        showSuccess(`${adminData.tournaments.length} tournaments loaded!`);
        
    } catch (error) {
        console.error('❌ Error loading tournaments:', error);
        showError('Failed to load tournaments: ' + error.message);
    }
}

// ============================================
// LOAD TRANSACTIONS
// ============================================

async function loadTransactions() {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    try {
        showLoading('Loading transactions...');
        
        const response = await fetch('http://localhost:5000/api/admin/transactions', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load transactions');
        
        const data = await response.json();
        adminData.transactions = data.data || [];
        
        console.log('✅ Transactions loaded:', adminData.transactions.length);
        
        if (adminData.transactions.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">No transactions found.</p>';
        } else {
            container.innerHTML = `
                <div style="margin-top: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <strong>Total Transactions: ${data.count || 0} | Total Revenue: ₹${data.totalAmount || 0} | Successful: ${data.successfulTransactions || 0}</strong>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #ecf0f1; border-bottom: 2px solid #bdc3c7;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Transaction ID</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">User</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Amount</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Status</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.transactions.map(transaction => `
                            <tr style="border-bottom: 1px solid #ecf0f1;">
                                <td style="padding: 12px; border: 1px solid #ecf0f1; font-family: monospace; font-size: 0.85em;">${transaction._id?.slice(-8) || 'N/A'}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">${transaction.user?.username || 'N/A'}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;"><strong>₹${transaction.amount}</strong></td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">
                                    <span style="background: ${transaction.status === 'completed' || transaction.status === 'success' ? '#d4edda' : '#fff3cd'}; color: ${transaction.status === 'completed' || transaction.status === 'success' ? '#155724' : '#856404'}; padding: 4px 8px; border-radius: 4px;">
                                        ${(transaction.status || 'pending').toUpperCase()}
                                    </span>
                                </td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;">${new Date(transaction.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        hideLoading();
        showSuccess(`${adminData.transactions.length} transactions loaded!`);
        
    } catch (error) {
        console.error('❌ Error loading transactions:', error);
        showError('Failed to load transactions: ' + error.message);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStatusColor(status) {
    const colors = {
        'draft': '#95a5a6',
        'open': '#3498db',
        'closed': '#e74c3c',
        'ongoing': '#f39c12',
        'completed': '#27ae60',
        'cancelled': '#c0392b'
    };
    return colors[status] || '#7f8c8d';
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function showLoading(message = 'Loading...') {
    const id = Date.now();
    const div = document.createElement('div');
    div.id = `loading-${id}`;
    div.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 9999;
        text-align: center;
        min-width: 250px;
    `;
    div.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(div);
    return id;
}

function hideLoading(id) {
    const el = document.getElementById(`loading-${id}`);
    if (el) el.remove();
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

function editGame(gameId) {
    showError('Edit feature coming soon!');
}

function deleteGame(gameId) {
    if (confirm('Are you sure you want to delete this game?')) {
        showError('Delete feature coming soon!');
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        showError('Delete feature coming soon!');
    }
}