// UI Helper Functions
const ui = {
    showLoading: (msg) => {
        const id = 'loading-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'loading-overlay'; // Assume CSS class exists for styling
        div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;';
        div.innerText = msg;
        document.body.appendChild(div);
        return id;
    },
    hideLoading: (id) => document.getElementById(id)?.remove(),
    notify: (msg, type = 'success') => {
        const div = document.createElement('div');
        div.style.cssText = `position:fixed;top:20px;right:20px;padding:1rem;border-radius:4px;color:#fff;background:${type === 'success' ? '#2ecc71' : '#e74c3c'};z-index:10000;box-shadow:0 2px 5px rgba(0,0,0,0.2);`;
        div.innerText = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    },
    toggleButton: (btn, isLoading) => {
        btn.disabled = isLoading;
        btn.style.opacity = isLoading ? '0.7' : '1';
        btn.style.cursor = isLoading ? 'not-allowed' : 'pointer';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm') || document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Extract form data
        const formData = {
            username: form.querySelector('input[placeholder*="username"]')?.value.trim(),
            email: form.querySelector('input[type="email"]')?.value.trim(),
            password: form.querySelector('input[type="password"]')?.value,
            role: form.querySelector('select')?.value
        };

        // Basic Validation
        if (!formData.username || formData.username.length < 3) return ui.notify('Username must be 3+ chars', 'error');
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return ui.notify('Invalid email address', 'error');
        if (!formData.password || formData.password.length < 6) return ui.notify('Password must be 6+ chars', 'error');
        if (!formData.role) return ui.notify('Please select a role', 'error');

        const loadingId = ui.showLoading('Creating account...');
        ui.toggleButton(submitBtn, true);

        try {
            const response = await fetch(API_ENDPOINTS.auth.signup, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Registration failed');

            ui.notify('Account created! Redirecting...', 'success');
            
            // Store temp auth state
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setTimeout(() => window.location.href = 'verify-email.html', 1500);
            form.reset();

        } catch (error) {
            console.error('Signup Error:', error);
            ui.notify(error.message, 'error');
        } finally {
            ui.hideLoading(loadingId);
            ui.toggleButton(submitBtn, false);
        }
    });
});