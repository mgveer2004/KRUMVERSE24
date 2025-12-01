// ============================================
// API CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================

const API_BASE_URL = 'http://localhost:5000/api';

const API_ENDPOINTS = {
  // ========== AUTH ENDPOINTS ==========
  auth: {
    signup: `${API_BASE_URL}/auth/signup`,
    login: `${API_BASE_URL}/auth/login`,
    verifyEmail: `${API_BASE_URL}/auth/verify-email`,
    resendVerification: `${API_BASE_URL}/auth/resend-verification`,
    me: `${API_BASE_URL}/auth/me`,
    emailStatus: `${API_BASE_URL}/auth/email-status`
  },

  // ========== GAME ENDPOINTS ==========
  games: {
    list: `${API_BASE_URL}/games`,
    get: (id) => `${API_BASE_URL}/games/${id}`,
    create: `${API_BASE_URL}/games`,
    update: (id) => `${API_BASE_URL}/games/${id}`,
    delete: (id) => `${API_BASE_URL}/games/${id}`
  },

  // ========== TOURNAMENT ENDPOINTS ==========
  tournaments: {
    list: `${API_BASE_URL}/tournaments`,
    get: (id) => `${API_BASE_URL}/tournaments/${id}`,
    create: `${API_BASE_URL}/tournaments`,
    update: (id) => `${API_BASE_URL}/tournaments/${id}`,
    delete: (id) => `${API_BASE_URL}/tournaments/${id}`,
    join: (id) => `${API_BASE_URL}/tournaments/${id}/join`,
    leave: (id) => `${API_BASE_URL}/tournaments/${id}/leave`,
    paymentOrder: (id) => `${API_BASE_URL}/tournaments/${id}/payment-order`,
    paymentVerify: (id) => `${API_BASE_URL}/tournaments/${id}/payment-verify`
  },

  // ========== ADMIN ENDPOINTS ==========
  admin: {
    games: `${API_BASE_URL}/admin/games`,
    users: `${API_BASE_URL}/admin/users`,
    tournaments: `${API_BASE_URL}/admin/tournaments`,
    transactions: `${API_BASE_URL}/admin/transactions`,
    stats: `${API_BASE_URL}/admin/stats/dashboard`
  }
};

// ============================================
// HELPER FUNCTION - GET AUTH HEADERS
// ============================================
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// ============================================
// EXPORT GLOBALLY
// ============================================
window.API_ENDPOINTS = API_ENDPOINTS;
window.getAuthHeaders = getAuthHeaders;