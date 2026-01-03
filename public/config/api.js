// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api'; // Relative path for production deployment

const API_ENDPOINTS = {
    auth: {
        signup: `${API_BASE_URL}/auth/signup`,
        login: `${API_BASE_URL}/auth/login`,
        verifyEmail: `${API_BASE_URL}/auth/verify-email`,
        resendVerification: `${API_BASE_URL}/auth/resend-verification`
    },
    tournaments: {
        list: `${API_BASE_URL}/tournaments`,
        create: `${API_BASE_URL}/tournaments`,
        details: (id) => `${API_BASE_URL}/tournaments/${id}`,
        join: (id) => `${API_BASE_URL}/tournaments/${id}/join`,
        verifyPayment: (id) => `${API_BASE_URL}/tournaments/${id}/payment-verify`
    },
    games: `${API_BASE_URL}/games`,
    news: `${API_BASE_URL}/news`
};