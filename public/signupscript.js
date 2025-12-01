// ============================================
// NOTIFICATION & HELPER FUNCTIONS
// ============================================
function showLoading(message = 'Loading...') {
  const id = 'loading-' + Date.now();
  const div = document.createElement('div');
  div.id = id;
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
  div.innerHTML = `<div>${message}</div>`;
  document.body.appendChild(div);
  return id;
}

function hideLoading(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
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

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

// ============================================
// SIGNUP FORM HANDLER - FIXED FOR EMAIL VERIFICATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form');

  if (!form) {
    console.error('❌ Form not found! Check HTML structure.');
    return;
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get form values
    const username = document.querySelector('input[placeholder="Enter your username"]').value.trim();
    const email = document.querySelector('input[type="email"]').value.trim();
    const password = document.querySelector('input[type="password"]').value;
    const role = document.querySelector('select').value;

    console.log('📝 Form values:', { username, email, role });

    // VALIDATION
    if (!username) {
      showError('Username is required');
      return;
    }

    if (username.length < 3) {
      showError('Username must be at least 3 characters');
      return;
    }

    if (!email) {
      showError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email');
      return;
    }

    if (!password) {
      showError('Password is required');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    if (!role) {
      showError('Please select a role');
      return;
    }

    // Show loading
    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    const loadingId = showLoading('Creating account...');

    try {
      console.log('📤 Sending signup request to: http://localhost:5000/api/auth/signup');
      console.log('📤 Data:', { username, email, role });

      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);

      // CHECK IF RESPONSE IS OK FIRST
      if (!response.ok) {
        let errorMessage = 'Signup failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}). Check if backend is running on port 5000.`;
        }
        throw new Error(errorMessage);
      }

      // NOW PARSE JSON (response is OK)
      const data = await response.json();
      console.log('✅ Signup successful!');
      console.log('📥 Response data:', data);

      hideLoading(loadingId);

      // Save session TEMPORARILY (user hasn't verified email yet)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('email', data.user.email);

      // Show success message
      showSuccess('✅ Account created! Check your email to verify.');

      // FIXED: Redirect to verify-email page instead of home
      console.log('🔄 Redirecting to verification page...');

      // Wait 2 seconds then redirect to verification page
      setTimeout(() => {
        window.location.href = 'verify-email.html';
      }, 2000);

      // Reset form
      form.reset();

    } catch (error) {
      hideLoading(loadingId);
      console.error('❌ Signup error:', error);
      console.error('Error details:', error.message);

      showError(error.message || 'Signup failed. Please try again.');
      setButtonLoading(submitBtn, false);
    }
  });
});