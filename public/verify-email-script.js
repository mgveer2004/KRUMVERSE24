document.addEventListener('DOMContentLoaded', () => {
    // 1. Get URL params
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    
    if (emailFromUrl) {
        document.getElementById('email').value = emailFromUrl;
    }

    // 2. Handle Form Submit
    const form = document.getElementById('verifyForm');
    if (form) {
        form.addEventListener('submit', handleVerify);
    }
});

async function handleVerify(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const token = document.getElementById('code').value.trim();
    const btn = document.querySelector('button');
    const msg = document.getElementById('message');

    if (!email || !token) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        // ✅ USE THE GLOBAL API CONFIG
        const response = await fetch(API_ENDPOINTS.auth.verifyEmail, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Verification failed');

        showMessage('✅ Email Verified! Redirecting to login...', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('Verify Error:', error);
        showMessage(error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Verify Email';
    }
}

function showMessage(text, type) {
    const el = document.getElementById('message');
    if (el) {
        el.textContent = text;
        el.className = type === 'success' ? 'success-message' : 'error-message';
        el.style.display = 'block';
    } else {
        alert(text);
    }
}