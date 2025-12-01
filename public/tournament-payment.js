// ============================================
// RAZORPAY PAYMENT HANDLER - TOURNAMENT REGISTRATION
// ============================================
// Handles all Razorpay payment logic for tournament entry
// ============================================

console.log('💳 Razorpay Payment Handler Loading...');

// ============================================
// CONFIGURATION
// ============================================

const RAZORPAY_CONFIG = {
    // Get this from Razorpay dashboard - https://dashboard.razorpay.com/app/keys
    KEY_ID: 'rzp_test_YOUR_KEY_HERE', // Replace with your Razorpay Key ID
    API_BASE: 'http://localhost:5000/api',
    CURRENCY: 'INR',
    TEST_MODE: true // Set to false in production
};

// ============================================
// LOAD RAZORPAY SCRIPT
// ============================================

function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.Razorpay) {
            console.log('✅ Razorpay already loaded');
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
            console.log('✅ Razorpay script loaded successfully');
            resolve();
        };
        
        script.onerror = () => {
            console.error('❌ Failed to load Razorpay script');
            reject(new Error('Razorpay script loading failed'));
        };
        
        document.body.appendChild(script);
    });
}

// ============================================
// MAIN PAYMENT FUNCTION
// ============================================

async function initiateRazorpayPayment(entryFee, tournamentId, tournamentName) {
    console.log('🎫 Initiating Razorpay Payment...');
    console.log('💰 Amount:', entryFee);
    console.log('🏆 Tournament ID:', tournamentId);

    try {
        // Step 1: Check authentication
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        
        if (!token || !username) {
            showPaymentError('Please login first to join tournament');
            return;
        }

        // Step 2: Load Razorpay if not loaded
        await loadRazorpayScript();

        // Step 3: Check if already registered
        const alreadyRegistered = await checkIfAlreadyRegistered(tournamentId);
        if (alreadyRegistered) {
            showPaymentError('You are already registered for this tournament');
            return;
        }

        // Step 4: Create order on backend
        const order = await createPaymentOrder(entryFee, tournamentId);
        console.log('📦 Order created:', order);

        // Step 5: Open Razorpay checkout
        openRazorpayCheckout(order, entryFee, tournamentId, tournamentName, username);

    } catch (error) {
        console.error('❌ Payment error:', error.message);
        showPaymentError(error.message);
    }
}

// ============================================
// CREATE PAYMENT ORDER ON BACKEND
// ============================================

async function createPaymentOrder(amount, tournamentId) {
    console.log('🔄 Creating payment order on backend...');

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${RAZORPAY_CONFIG.API_BASE}/payments/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100), // Convert to paise (Razorpay requires amount in paise)
                currency: RAZORPAY_CONFIG.CURRENCY,
                tournamentId: tournamentId,
                receipt: `tournament_${tournamentId}_${Date.now()}`
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP Error ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Order created successfully:', data);
        return data.order; // Should contain: id, amount, currency

    } catch (error) {
        console.error('❌ Order creation failed:', error.message);
        throw new Error(`Failed to create payment order: ${error.message}`);
    }
}

// ============================================
// OPEN RAZORPAY CHECKOUT MODAL
// ============================================

function openRazorpayCheckout(order, amount, tournamentId, tournamentName, username) {
    console.log('📱 Opening Razorpay checkout modal...');

    const options = {
        key: RAZORPAY_CONFIG.KEY_ID,
        amount: order.amount, // Amount in paise
        currency: order.currency,
        name: 'KrumVerse Tournament',
        description: `Entry fee for ${tournamentName}`,
        order_id: order.id, // This is important - it links to the order created on backend
        
        // User details pre-filled
        prefill: {
            name: username,
            email: localStorage.getItem('email') || ''
        },
        
        // Handler for successful payment
        handler: function(response) {
            console.log('✅ Payment successful!');
            console.log('Payment ID:', response.razorpay_payment_id);
            console.log('Order ID:', response.razorpay_order_id);
            console.log('Signature:', response.razorpay_signature);
            
            handlePaymentSuccess(
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature,
                tournamentId,
                amount
            );
        },
        
        // Handler for payment error
        modal: {
            ondismiss: function() {
                console.warn('⚠️ Payment modal closed by user');
                showPaymentError('Payment cancelled. Please try again.');
            }
        },
        
        // Additional options
        theme: {
            color: '#3399cc'
        },
        
        // Retry logic
        retry: {
            enabled: true,
            max_retries: 3
        }
    };

    try {
        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', function(response) {
            console.error('❌ Payment failed:', response.error);
            handlePaymentFailure(response.error, tournamentId);
        });
        
        razorpay.open();
    } catch (error) {
        console.error('❌ Error opening Razorpay:', error.message);
        showPaymentError(`Failed to open payment gateway: ${error.message}`);
    }
}

// ============================================
// HANDLE PAYMENT SUCCESS
// ============================================

async function handlePaymentSuccess(paymentId, orderId, signature, tournamentId, amount) {
    console.log('🎉 Handling payment success...');
    
    showPaymentLoading('Verifying payment... Please wait');

    const token = localStorage.getItem('token');

    try {
        // Step 1: Verify payment on backend
        const verifyResponse = await fetch(`${RAZORPAY_CONFIG.API_BASE}/payments/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                razorpay_payment_id: paymentId,
                razorpay_order_id: orderId,
                razorpay_signature: signature,
                tournamentId: tournamentId
            })
        });

        if (!verifyResponse.ok) {
            const error = await verifyResponse.json();
            throw new Error(error.message || 'Payment verification failed');
        }

        const verifyData = await verifyResponse.json();
        console.log('✅ Payment verified on backend:', verifyData);

        // Step 2: Register player for tournament
        const registerResponse = await fetch(`${RAZORPAY_CONFIG.API_BASE}/tournaments/${tournamentId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                paymentId: paymentId,
                orderId: orderId
            })
        });

        if (!registerResponse.ok) {
            const error = await registerResponse.json();
            throw new Error(error.message || 'Failed to register for tournament');
        }

        const registerData = await registerResponse.json();
        console.log('✅ Successfully registered for tournament:', registerData);

        // Step 3: Show success message
        hidePaymentLoading();
        showPaymentSuccess(`✅ Payment successful! You've joined the tournament! Confirmation: ${paymentId}`);

        // Step 4: Update UI
        updateTournamentUIAfterJoin(tournamentId);

        // Step 5: Redirect or reload after 2 seconds
        setTimeout(() => {
            location.reload(); // Reload to show updated participants list
        }, 2000);

    } catch (error) {
        console.error('❌ Payment success handler error:', error.message);
        hidePaymentLoading();
        showPaymentError(`Payment verified but registration failed: ${error.message}`);
    }
}

// ============================================
// HANDLE PAYMENT FAILURE
// ============================================

async function handlePaymentFailure(error, tournamentId) {
    console.error('❌ Payment failed:', error);
    
    const errorMessage = error.description || error.message || 'Payment failed. Please try again.';
    showPaymentError(`Payment Failed: ${errorMessage}`);

    // Optional: Log failure to backend for analytics
    try {
        const token = localStorage.getItem('token');
        await fetch(`${RAZORPAY_CONFIG.API_BASE}/payments/log-failure`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                tournamentId: tournamentId,
                error: error
            })
        });
    } catch (e) {
        console.warn('Could not log payment failure:', e.message);
    }
}

// ============================================
// CHECK IF ALREADY REGISTERED
// ============================================

async function checkIfAlreadyRegistered(tournamentId) {
    console.log('🔍 Checking if already registered...');

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${RAZORPAY_CONFIG.API_BASE}/tournaments/${tournamentId}/check-registration`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.warn('Could not check registration status');
            return false;
        }

        const data = await response.json();
        console.log('Registration check:', data);
        return data.isRegistered || false;

    } catch (error) {
        console.warn('Error checking registration:', error.message);
        return false; // Don't block payment if check fails
    }
}

// ============================================
// UPDATE UI AFTER SUCCESSFUL JOIN
// ============================================

function updateTournamentUIAfterJoin(tournamentId) {
    console.log('🔄 Updating tournament UI...');

    // Hide join button
    const joinBtn = document.getElementById('joinTournament');
    if (joinBtn) {
        joinBtn.style.display = 'none';
    }

    // Show "Already joined" message
    const joinedMsg = document.createElement('div');
    joinedMsg.id = 'joinedMessage';
    joinedMsg.style.cssText = `
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
        margin: 20px 0;
    `;
    joinedMsg.innerHTML = '✅ You have successfully joined this tournament!';

    const joinContainer = document.getElementById('joinContainer') || joinBtn?.parentElement;
    if (joinContainer) {
        joinContainer.appendChild(joinedMsg);
    }

    // Refresh participants list
    if (typeof loadParticipants === 'function') {
        loadParticipants(tournamentId);
    }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function showPaymentLoading(message = 'Processing payment...') {
    console.log('🔄', message);

    const loader = document.createElement('div');
    loader.id = 'paymentLoader';
    loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px 40px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 9999;
        text-align: center;
        min-width: 250px;
    `;
    loader.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 15px;">⏳</div>
        <p style="margin: 0; font-weight: bold;">${message}</p>
        <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Please don't close this window</p>
    `;

    document.body.appendChild(loader);
}

function hidePaymentLoading() {
    const loader = document.getElementById('paymentLoader');
    if (loader) {
        loader.remove();
    }
}

function showPaymentSuccess(message) {
    console.log('✅', message);

    const successDiv = document.createElement('div');
    successDiv.id = 'paymentSuccess';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 20px 25px;
        border-radius: 8px;
        z-index: 9998;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    successDiv.innerHTML = `
        <strong>✅ Success!</strong><br>
        ${message}
    `;

    document.body.appendChild(successDiv);

    // Add animation
    const style = document.createElement('style');
    style.innerHTML = `
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
    `;
    document.head.appendChild(style);

    // Auto remove after 5 seconds
    setTimeout(() => {
        successDiv.style.opacity = '0';
        successDiv.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => successDiv.remove(), 300);
    }, 5000);
}

function showPaymentError(message) {
    console.error('❌', message);

    const errorDiv = document.createElement('div');
    errorDiv.id = 'paymentError';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 20px 25px;
        border-radius: 8px;
        z-index: 9998;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    errorDiv.innerHTML = `
        <strong>❌ Error!</strong><br>
        ${message}
    `;

    document.body.appendChild(errorDiv);

    // Auto remove after 6 seconds
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => errorDiv.remove(), 300);
    }, 6000);
}

// ============================================
// EXPORT FUNCTIONS (for use in other scripts)
// ============================================

window.PaymentHandler = {
    initiateRazorpayPayment: initiateRazorpayPayment,
    checkIfAlreadyRegistered: checkIfAlreadyRegistered,
    loadRazorpayScript: loadRazorpayScript
};

console.log('✅ Razorpay Payment Handler loaded successfully!');