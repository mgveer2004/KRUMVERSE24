// ============================================
// LOGIN LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) return;

    // Toggle Password Visibility (Optional feature you might want later)
    // const togglePassword = document.querySelector('#togglePassword');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('loginBtn');
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const originalBtnText = submitBtn.textContent;

        // Basic UI Cleanup
        const ui = {
            setLoading: (isLoading) => {
                submitBtn.disabled = isLoading;
                submitBtn.textContent = isLoading ? 'Signing in...' : originalBtnText;
                submitBtn.style.opacity = isLoading ? '0.7' : '1';
            },
            showError: (msg) => {
                const el = document.getElementById('errorMessage');
                if (el) {
                    el.textContent = msg;
                    el.classList.add('show');
                    setTimeout(() => el.classList.remove('show'), 5000);
                }
            },
            showSuccess: (msg) => {
                const el = document.getElementById('successMessage');
                if (el) {
                    el.textContent = msg;
                    el.classList.add('show');
                }
            }
        };

        if (!email || !password) return ui.showError('Please enter both email and password');
        
        try {
            ui.setLoading(true);

            const response = await fetch(API_ENDPOINTS.auth.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Login failed');

            // Success
            ui.showSuccess('Login successful! Redirecting...');
            
            // Store Auth Data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect Strategy
            setTimeout(() => {
                window.location.href = data.user.role === 'admin' ? 'admin-dashboard.html' : 'index.html';
            }, 1000);

        } catch (error) {
            console.error('Login Error:', error);
            ui.showError(error.message || 'Unable to connect to server');
        } finally {
            ui.setLoading(false);
        }
    });
});

// Google Login Placeholder (Keep logic separate)
function handleGoogleLogin() {
    console.log('Google login initiated');
    // Implement Google Identity Services logic here when ready
    alert('Google Login is currently in development mode.');
}