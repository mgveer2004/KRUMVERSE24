// ============================================
// REUSABLE NOTIFICATION SYSTEM
// ============================================

// Show success notification
function showSuccess(message, duration = 3000) {
  showNotification(message, 'success', duration);
}

// Show error notification
function showError(message, duration = 4000) {
  showNotification(message, 'error', duration);
}

// Show info notification
function showInfo(message, duration = 3000) {
  showNotification(message, 'info', duration);
}

// Show loading notification
function showLoading(message = 'Loading...') {
  const id = Date.now();
  showNotification(message, 'loading', 0, id);
  return id;
}

// Hide loading notification
function hideLoading(id) {
  const notification = document.getElementById(`notification-${id}`);
  if (notification) {
    notification.remove();
  }
}

// Main notification function
function showNotification(message, type = 'info', duration = 3000, id = null) {
  const notificationId = id || Date.now();
  
  // Create notification container if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.id = `notification-${notificationId}`;
  notification.style.cssText = `
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease-out;
    max-width: 100%;
    word-wrap: break-word;
  `;

  // Set color based on type
  const colors = {
    success: { bg: '#d4edda', color: '#155724', icon: '✓' },
    error: { bg: '#f8d7da', color: '#721c24', icon: '✕' },
    info: { bg: '#d1ecf1', color: '#0c5460', icon: 'ℹ' },
    loading: { bg: '#fff3cd', color: '#856404', icon: '⟳' }
  };

  const style = colors[type] || colors.info;
  notification.style.backgroundColor = style.bg;
  notification.style.color = style.color;

  // Add icon and message
  notification.innerHTML = `
    <span style="font-size: 18px; font-weight: bold;">${style.icon}</span>
    <span>${message}</span>
  `;

  // Add to container
  container.appendChild(notification);

  // Add CSS animation
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  if (!document.getElementById('notification-styles')) {
    styleSheet.id = 'notification-styles';
    document.head.appendChild(styleSheet);
  }

  // Auto-remove after duration (if not loading)
  if (duration > 0) {
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  return notificationId;
}

// Form validation helper
function validateForm(formId) {
  const form = document.getElementById(formId);
  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  let isValid = true;
  let errors = [];

  inputs.forEach(input => {
    // Remove previous error styling
    input.style.borderColor = '';

    // Check if empty
    if (!input.value.trim()) {
      isValid = false;
      input.style.borderColor = '#dc3545';
      errors.push(`${input.name || input.id} is required`);
    }

    // Email validation
    if (input.type === 'email' && input.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        isValid = false;
        input.style.borderColor = '#dc3545';
        errors.push('Invalid email format');
      }
    }

    // Number validation
    if (input.type === 'number' && input.value) {
      const min = input.min ? parseFloat(input.min) : null;
      const max = input.max ? parseFloat(input.max) : null;
      const value = parseFloat(input.value);

      if (min !== null && value < min) {
        isValid = false;
        input.style.borderColor = '#dc3545';
        errors.push(`${input.name || input.id} must be at least ${min}`);
      }

      if (max !== null && value > max) {
        isValid = false;
        input.style.borderColor = '#dc3545';
        errors.push(`${input.name || input.id} must not exceed ${max}`);
      }
    }
  });

  if (!isValid) {
    showError(errors[0]); // Show first error
  }

  return isValid;
}

// Loading button helper
function setButtonLoading(button, loading = true) {
  if (loading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <span style="display: inline-block; animation: spin 1s linear infinite;">⟳</span>
      Loading...
    `;
    
    // Add spin animation if not exists
    if (!document.getElementById('spin-animation')) {
      const style = document.createElement('style');
      style.id = 'spin-animation';
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || 'Submit';
  }
}
