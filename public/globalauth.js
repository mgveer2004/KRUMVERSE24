// ============================================
// GLOBAL AUTHENTICATION CHECKER
// Include this file in EVERY page
// ============================================
(function() {
    'use strict';

    // ============================================
    // CHECK USER AUTHENTICATION STATUS
    // ============================================
    function checkGlobalAuth() {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');

        if (token && username) {
            // ✅ User is logged in
            console.log('✅ User logged in:', username, '| Role:', role || 'player');
            updateHeaderForLoggedInUser(username, role || 'player');
        } else {
            // ❌ User is NOT logged in
            console.log('❌ No user logged in');
            updateHeaderForGuest();
        }
    }

    // ============================================
    // UPDATE HEADER - LOGGED IN USER
    // ============================================
    function updateHeaderForLoggedInUser(username, role) {
        // Try new ID first (navbar-buttons), fall back to old class (.auth-buttons)
        let authContainer = document.getElementById('auth-container') || 
                           document.querySelector('.navbar-buttons') ||
                           document.querySelector('.auth-buttons');
        
        if (!authContainer) {
            console.warn('⚠️ Auth container not found in DOM');
            return;
        }

        // Get first letter of username for avatar
        const userInitial = username.charAt(0).toUpperCase();

        // Inject profile dropdown HTML
        authContainer.innerHTML = `
            <div class="user-profile-dropdown">
                <div class="profile-circle" id="profileCircle" title="${username}">
                    ${userInitial}
                </div>
                <div class="profile-dropdown-menu" id="profileDropdown">
                    <div class="dropdown-header">
                        <strong>${username}</strong>
                        <small>${role}</small>
                    </div>
                    <a href="profile.html" class="dropdown-item">
                        <span class="item-icon">👤</span>
                        <span>My Profile</span>
                    </a>
                    <a href="dashboard.html" class="dropdown-item">
                        <span class="item-icon">📊</span>
                        <span>Dashboard</span>
                    </a>
                    <a href="settings.html" class="dropdown-item">
                        <span class="item-icon">⚙️</span>
                        <span>Settings</span>
                    </a>
                    <a href="#" class="dropdown-item logout-item" id="logoutBtn">
                        <span class="item-icon">🚪</span>
                        <span>Logout</span>
                    </a>
                </div>
            </div>
        `;

        // Add styles and event listeners
        addProfileDropdownStyles();
        attachEventListeners();
    }

    // ============================================
    // UPDATE HEADER - GUEST USER
    // ============================================
    function updateHeaderForGuest() {
        // Try new ID first (navbar-buttons), fall back to old class (.auth-buttons)
        let authContainer = document.getElementById('auth-container') || 
                           document.querySelector('.navbar-buttons') ||
                           document.querySelector('.auth-buttons');
        
        if (!authContainer) {
            console.warn('⚠️ Auth container not found in DOM');
            return;
        }

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        if (currentPage === 'index.html' || currentPage === '') {
            // Home page: Show Login + Sign Up
            authContainer.innerHTML = `
                <a href="login.html" class="btn btn-primary">Login</a>
                <a href="signup.html" class="btn btn-outline">Sign Up</a>
            `;
        } else {
            // Other pages: Show "Login to continue"
            authContainer.innerHTML = `
                <a href="login.html" class="btn btn-primary">Login to Continue</a>
            `;
        }
    }

    // ============================================
    // ATTACH EVENT LISTENERS
    // ============================================
    function attachEventListeners() {
        setTimeout(() => {
            const profileCircle = document.getElementById('profileCircle');
            const logoutBtn = document.getElementById('logoutBtn');
            const dropdown = document.getElementById('profileDropdown');

            // Profile circle click - toggle dropdown
            if (profileCircle) {
                profileCircle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dropdown) {
                        dropdown.classList.toggle('show');
                    }
                });
            }

            // Logout button click
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    logout();
                });
            }

            // Close dropdown when clicking outside
            document.addEventListener('click', function(event) {
                if (dropdown && profileCircle && !profileCircle.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.remove('show');
                }
            });
        }, 100);
    }

    // ============================================
    // LOGOUT FUNCTION
    // ============================================
    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            localStorage.removeItem('profileData');
            console.log('✅ Logged out successfully!');
            window.location.href = 'index.html';
        }
    }

    // ============================================
    // ADD DROPDOWN STYLES
    // ============================================
    function addProfileDropdownStyles() {
        if (document.getElementById('profile-dropdown-styles')) return;

        const style = document.createElement('style');
        style.id = 'profile-dropdown-styles';
        style.textContent = `
            /* Profile Dropdown Container */
            .user-profile-dropdown {
                position: relative;
                display: inline-block;
            }

            /* Profile Circle Icon */
            .profile-circle {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea, #764ba2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                font-weight: 600;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                user-select: none;
            }

            .profile-circle:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
            }

            /* Dropdown Menu */
            .profile-dropdown-menu {
                display: none;
                position: absolute;
                top: 110%;
                right: 0;
                background: #fff;
                min-width: 220px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.25);
                overflow: hidden;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.25s ease, visibility 0.25s ease;
            }

            .profile-dropdown-menu.show {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                animation: slideDown 0.25s ease-out;
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Dropdown Header */
            .dropdown-header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: #fff;
                padding: 15px;
                text-align: center;
            }

            .dropdown-header strong {
                display: block;
                font-size: 1.05rem;
                margin-bottom: 4px;
                font-weight: 600;
            }

            .dropdown-header small {
                text-transform: uppercase;
                opacity: 0.9;
                font-size: 0.7rem;
                letter-spacing: 0.8px;
            }

            /* Dropdown Items */
            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
                color: #333;
                text-decoration: none;
                transition: all 0.2s ease;
                font-size: 0.9rem;
                border-bottom: 1px solid #f0f0f0;
            }

            .dropdown-item:last-child {
                border-bottom: none;
            }

            .dropdown-item:hover {
                background: #f5f5f5;
                padding-left: 20px;
            }

            .item-icon {
                font-size: 1.1rem;
            }

            .logout-item {
                color: #e74c3c;
                font-weight: 600;
            }

            .logout-item:hover {
                background: #feecec;
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .profile-circle {
                    width: 36px;
                    height: 36px;
                    font-size: 1rem;
                }
                .profile-dropdown-menu {
                    min-width: 200px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================
    // RUN ON PAGE LOAD
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkGlobalAuth);
    } else {
        checkGlobalAuth();
    }

})();