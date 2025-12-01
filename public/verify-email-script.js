// ============================================
// VERIFY EMAIL SCRIPT - MANUAL CODE ENTRY ONLY
// User enters 6-digit code from email
// ============================================

console.log('✅ verify-email-script.js loaded');

const API_BASE = 'http://localhost:5000/api';
const API_ENDPOINTS = {
  auth: {
    verifyEmail: `${API_BASE}/auth/verify-email`,
    resendVerification: `${API_BASE}/auth/resend-verification`
  }
};

// ============================================
// INITIALIZE PAGE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Page loaded');
  
  // Get email from localStorage (set during signup)
  const email = localStorage.getItem('email');
  const emailDisplay = document.getElementById('email-display');
  
  if (email && emailDisplay) {
    emailDisplay.textContent = email;
    console.log('📧 User email:', email);
  }
  
  // Setup code input
  setupCodeInput();
});

// ============================================
// CODE INPUT HANDLING
// ============================================
function setupCodeInput() {
  const codeInput = document.getElementById('verification-code');
  
  if (!codeInput) {
    console.error('❌ Code input field not found');
    return;
  }
  
  // Listen for input changes
  codeInput.addEventListener('input', function(e) {
    // Only allow numbers
    this.value = this.value.replace(/[^0-9]/g, '');
    
    // Auto-submit when 6 digits entered
    if (this.value.length === 6) {
      console.log('📝 6-digit code complete');
      setTimeout(() => {
        verifyEmailFromCode();
      }, 500);
    }
  });
  
  // Handle paste events
  codeInput.addEventListener('paste', function(e) {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const numbersOnly = pastedText.replace(/[^0-9]/g, '').substring(0, 6);
    this.value = numbersOnly;
    
    console.log('📋 Pasted code:', numbersOnly);
    
    if (numbersOnly.length === 6) {
      setTimeout(() => {
        verifyEmailFromCode();
      }, 500);
    }
  });
  
  // Auto focus on page load
  codeInput.focus();
}

// ============================================
// VERIFY EMAIL WITH CODE
// ============================================
function verifyEmailFromCode() {
  const code = document.getElementById('verification-code').value;
  const email = localStorage.getItem('email');
  
  console.log('🔍 Verifying code:');
  console.log('   Email:', email);
  console.log('   Code:', code);
  
  // Validation
  if (!code || code.length !== 6) {
    showError('❌ Please enter a valid 6-digit code');
    return;
  }
  
  if (!email) {
    showError('❌ Email not found. Please sign up again.');
    return;
  }
  
  // Show loading state
  const btn = document.getElementById('verify-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Verifying...';
  }
  
  console.log('📤 Sending verification request...');
  
  // Send verification request
  fetch(API_ENDPOINTS.auth.verifyEmail, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      email: email,
      token: code
    })
  })
    .then(response => {
      console.log('📊 Response Status:', response.status);
      return response.json().then(data => ({ status: response.status, data }));
    })
    .then(({ status, data }) => {
      console.log('📥 Response:', data);
      
      if (status === 200 && data.success) {
        console.log('✅ EMAIL VERIFIED SUCCESSFULLY!');
        showSuccessPage('✅ Email Verified Successfully!');
      } else {
        console.error('❌ Verification failed:', data.message);
        showError(data.message || 'Invalid or expired code');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '✓ Verify';
        }
      }
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      showConnectionError(error.message);
      if (btn) {
        btn.disabled = false;
        btn.textContent = '✓ Verify';
      }
    });
}

// ============================================
// RESEND CODE
// ============================================
function resendCode() {
  const email = localStorage.getItem('email');
  
  if (!email) {
    showError('❌ Email not found');
    return;
  }
  
  const btn = document.getElementById('resend-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '📧 Sending...';
  }
  
  console.log('📧 Resending verification code to:', email);
  
  fetch(API_ENDPOINTS.auth.resendVerification, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Resend response:', data);
      if (data.success) {
        showError('✅ New code sent to your email!');
        
        // Clear code input
        const codeInput = document.getElementById('verification-code');
        if (codeInput) {
          codeInput.value = '';
          codeInput.focus();
        }
        
        if (btn) {
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = '📧 Resend Code';
          }, 3000);
        }
      } else {
        showError(data.message || '❌ Failed to resend code');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '📧 Resend Code';
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showConnectionError(error.message);
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📧 Resend Code';
      }
    });
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function showSuccessPage(message) {
  const contentDiv = document.getElementById('content') || document.body;
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <div style="font-size: 80px; margin-bottom: 20px;">✅</div>
      <h2 style="color: #27ae60; font-size: 32px;">${message}</h2>
      <p style="color: #666; font-size: 16px; margin-top: 15px;">
        Your email has been verified. Redirecting to login...
      </p>
      <div style="margin-top: 30px;">
        <button onclick="window.location.href='login.html'" style="
          background: #27ae60;
          color: white;
          padding: 14px 40px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
        ">
          Go to Login →
        </button>
      </div>
    </div>
  `;
  
  // Auto-redirect after 3 seconds
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 3000);
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.innerHTML = `<div style="
      background: #fadbd8;
      color: #c0392b;
      padding: 12px 15px;
      border-radius: 6px;
      font-size: 14px;
      margin-bottom: 15px;
      border-left: 4px solid #c0392b;
    ">${message}</div>`;
    
    // Auto clear after 5 seconds (unless success)
    if (!message.includes('✅')) {
      setTimeout(() => {
        errorDiv.innerHTML = '';
      }, 5000);
    }
  }
}

function showConnectionError(message) {
  showError(`🌐 Connection Error: ${message}`);
}

// ============================================
// FORM SUBMIT
// ============================================
const form = document.getElementById('verify-form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    verifyEmailFromCode();
  });
}

console.log('✅ verify-email-script.js ready');
console.log('📝 Manual code entry mode - user must enter 6-digit code');