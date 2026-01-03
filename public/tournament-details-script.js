// ============================================
// TOURNAMENT DETAILS & CHAT SCRIPT - FINAL FIXED VERSION
// ============================================

// 🚨 POLISH: Direct import from modules (relies on HTML file pre-loading the URL)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, collection, query, orderBy, onSnapshot, 
    addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

console.log('🎮 Tournament Details Script Loaded (Module)');

// ============================================
// CONFIGURATION
// ============================================
const API_BASE = 'http://localhost:5000/api';
// 🚨 POLISH: Use hardcoded test key as fallback, but rely on API response for payment flow
const RAZORPAY_KEY_ID = 'rzp_test_RlxelfIP7Gy0Nj'; 
const USE_MOCK_PAYMENT = true; 

let currentTournament = null;
let currentUser = null;
let tournamentId = null;

let db, auth; 
let firebaseAppId = null;


// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    tournamentId = urlParams.get('id');
    
    if (!tournamentId) {
        displayError('Invalid tournament ID');
        return;
    }

    // Load current user details from localStorage
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
        try {
            // 🚨 POLISH: Parse user object once
            currentUser = JSON.parse(userDataString);
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    
    // 1. Load Tournament Details first to get initial data
    await loadTournamentDetails(tournamentId);

    // 2. Initialize Firebase and Auth (if config is present)
    // 🚨 FIX: Safely retrieve config from window scope
    const resolvedFirebaseConfig = window.__firebase_config ? JSON.parse(window.__firebase_config) : null;
    firebaseAppId = window.__firebase_app_id || 'default-app-id';
    
    if (resolvedFirebaseConfig) {
        await initializeFirebaseAndAuth(resolvedFirebaseConfig);
    } else {
        console.warn("🛑 Firebase config is missing from HTML. Chat disabled.");
    }

    // 3. Setup Chat (after tournament and auth are ready)
    if (db && currentUser && currentTournament) {
        setupChat(tournamentId);
    }
    
    // 🚨 CRITICAL FIX 3: Attach event listeners to the chat input/button
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (chatInput) {
        // Prevent form submission and call sendMessage on Enter
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                sendMessage();
            }
        });
    }

});

// ============================================
// FIREBASE & AUTH SETUP (FINAL STABILITY FIX)
// ============================================

async function initializeFirebaseAndAuth(resolvedFirebaseConfig) {
    
    try {
        const app = initializeApp(resolvedFirebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
    
        // Use currentUser.id as the custom token to identify the user if token exists.
        // For KrumVerse MVP, we sign in anonymously as chat access is determined by participation status.
        await signInAnonymously(auth);
    
        await new Promise(resolve => {
            onAuthStateChanged(auth, user => {
                if (user) {
                    console.log('✅ Firebase Signed In Anonymously:', user.uid);
                }
                resolve();
            });
        });
        
    } catch (error) {
        console.error("❌ Firebase Auth/Initialization Error:", error);
    }
}

// ============================================
// LOAD TOURNAMENT DETAILS
// ============================================

async function loadTournamentDetails(id) {
    try {
        const url = `${API_BASE}/tournaments/${id}`;
        const response = await fetch(url);
        
        if (!response.ok) { throw new Error(`Failed to fetch tournament: ${response.status}`); }
        
        const responseData = await response.json();
        
        if (responseData.success && responseData.data) {
            currentTournament = responseData.data;
            displayTournamentDetails();
            document.getElementById('mainGrid').style.display = 'grid';
            document.getElementById('loadingState').style.display = 'none';
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        displayError('Failed to load tournament details: ' + error.message);
    }
}

// ============================================
// DISPLAY TOURNAMENT DETAILS
// ============================================

function displayTournamentDetails() {
    const t = currentTournament;
    
    document.getElementById('tournamentTitle').textContent = t.name || 'Unknown Tournament';
    document.getElementById('organizerUsername').textContent = t.organizer?.username || 'Unknown Organizer';
    document.getElementById('gameName').textContent = t.game?.name || 'Unknown Game';
    document.getElementById('gameCategory').textContent = t.game?.category || 'Esports';
    
    document.getElementById('status').textContent = (t.status || 'draft').toUpperCase();
    document.getElementById('startDate').textContent = new Date(t.startDate).toLocaleString();
    
    const feeEl = document.getElementById('registrationFee');
    feeEl.textContent = t.registrationFee > 0 ? `₹${t.registrationFee}` : 'FREE';
    feeEl.className = t.registrationFee > 0 ? 'value fee-paid' : 'value fee-free';

    document.getElementById('prizePool').textContent = t.prizePool || 'N/A';
    document.getElementById('participantCount').textContent = `${t.participants?.length || 0}`;
    document.getElementById('maxParticipants').textContent = t.maxParticipants || '∞';
    
    document.getElementById('description').textContent = t.description || 'No description provided.';
    document.getElementById('rules').textContent = t.rules || 'No rules specified.';
    
    updateActionButton(t);
}

// ============================================
// ACTION BUTTON & JOIN LOGIC
// ============================================

function updateActionButton(t) {
    const btn = document.getElementById('registerBtn');
    const registerText = document.getElementById('registerText');
    
    const currentUserIdString = currentUser?.id?.toString();

    // 🚨 FIX: Ensure participant ID check uses toString() on participant.user._id
    const participant = t.participants.find(p => p.user?.toString() === currentUserIdString);
    const isRegistered = !!participant;
    
    if (t.status !== 'open') {
        registerText.textContent = `STATUS: ${t.status.toUpperCase()}`;
        btn.disabled = true;
    } else if (t.currentParticipants >= t.maxParticipants) {
        registerText.textContent = 'REGISTRATION FULL';
        btn.disabled = true;
    } else if (isRegistered) {
        if (t.registrationFee > 0 && participant.paymentStatus !== 'completed') {
            registerText.textContent = 'PAYMENT PENDING - CLICK TO PAY';
            btn.disabled = false;
            btn.onclick = () => handleJoinTournament();
        } else {
            registerText.textContent = '✓ ALREADY REGISTERED';
            btn.disabled = true;
        }
    } else {
        registerText.textContent = t.registrationFee > 0 ? `REGISTER & PAY ₹${t.registrationFee}` : 'REGISTER FREE';
        btn.disabled = false;
        btn.onclick = () => handleJoinTournament();
    }
}


async function handleJoinTournament() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login first to join tournaments');
        window.location.href = 'login.html';
        return;
    }
    
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    
    try {
        const joinRes = await fetch(
            `${API_BASE}/tournaments/${tournamentId}/join`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        const joinData = await joinRes.json();
        
        if (!joinRes.ok) {
            alert('❌ Join error: ' + joinData.message);
            btn.disabled = false;
            return;
        }
        
        if (currentTournament.registrationFee > 0 && joinData.data?.orderId) {
            startPayment(joinData.data);
        } else {
            alert('✅ Joined tournament successfully!');
            setTimeout(() => location.reload(), 1500); 
        }
        
    } catch (error) {
        console.error('❌ Error joining:', error);
        alert('Error: ' + error.message);
        btn.disabled = false;
    }
}

// ============================================
// RAZORPAY PAYMENT FLOW
// ============================================

async function startPayment(orderData) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // --- MOCK PAYMENT BYPASS (Active for development) ---
    if (USE_MOCK_PAYMENT) { 
        console.warn('⚡ MOCK PAYMENT ENABLED. Bypassing Razorpay widget.');
        
        const mockResponse = {
            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 12),
            razorpay_order_id: orderData.orderId,
            razorpay_signature: 'mock_signature_valid' 
        };
        
        verifyPayment(mockResponse);
        return; 
    }
    // --- END MOCK BYPASS ---

    // --- LIVE RAZORPAY WIDGET (Fallback) ---
    const options = {
        key: RAZORPAY_KEY_ID, 
        amount: orderData.amount, 
        currency: 'INR',
        name: 'KRUMVERSE',
        description: `Registration - ${currentTournament.name}`,
        order_id: orderData.orderId,
        
        handler: function(response) {
            verifyPayment(response);
        },
        
        prefill: {
            name: user.username || 'Player',
            email: user.email || 'player@krumverse.com'
        },
        
        theme: { color: '#667eea' }
    };
    
    try {
        new Razorpay(options).open();
    } catch (error) {
        console.error('❌ Razorpay opening error:', error);
        alert('Failed to open payment gateway: ' + error.message);
    }
}

async function verifyPayment(paymentData) {
    const token = localStorage.getItem('token');
    
    try {
        const verifyRes = await fetch(
            `${API_BASE}/tournaments/${tournamentId}/payment-verify`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    razorpayOrderId: paymentData.razorpay_order_id,
                    razorpayPaymentId: paymentData.razorpay_payment_id,
                    razorpaySignature: paymentData.razorpay_signature
                })
            }
        );
        
        const verifyData = await verifyRes.json();
        
        if (!verifyRes.ok) {
            alert('❌ Payment verification failed: ' + verifyData.message);
            return;
        }
        
        alert('✅ Payment verified! Tournament joined!');
        setTimeout(() => location.reload(), 1500);
        
    } catch (error) {
        console.error('❌ Verification error:', error);
        alert('Verification error: ' + error.message);
    }
}

// ============================================
// 5. FIREBASE CHAT IMPLEMENTATION (Cleaned up)
// ============================================

function setupChat(tId) {
    const t = currentTournament;
    
    // Get current user ID string (from local storage)
    const currentUserId = currentUser?.id; 

    // 🚨 FIX: Ensure Organizer check uses currentUser.id (from localstorage user object)
    const isOrganizer = t.organizer?._id?.toString() === currentUserId;

    // 🚨 FIX: Ensure Participant check uses toString() on participant.user
    const isParticipant = t.participants.some(p => 
        p.user?.toString() === currentUserId
    );

    const isAuthorized = isOrganizer || isParticipant;

    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!isAuthorized) {
        chatInput.placeholder = "You must register or be the organizer to chat.";
        // 🚨 FIX: Ensure buttons are disabled if unauthorized
        chatInput.disabled = true;
        sendBtn.disabled = true;
        return;
    }

    // --- CHAT ENABLED ---
    console.log(`✅ CHAT UNLOCKED: Organizer: ${isOrganizer}, Participant: ${isParticipant}`);
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.placeholder = "Type your message...";
    
    if (!db) {
        console.error("Firestore not initialized. Cannot load messages.");
        return;
    }
    
    // 🚨 FIX: Use the globally provided app ID in the path
    const chatCollectionRef = collection(db, `artifacts/${firebaseAppId}/public/data/tournament_chats/${tId}/messages`);
    const q = query(chatCollectionRef, orderBy('createdAt', 'asc'));

    onSnapshot(q, (snapshot) => {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        snapshot.forEach((doc) => {
            renderMessage(doc.data());
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const messageText = chatInput.value.trim();

    if (!messageText || !db || !currentTournament || !currentUser) return;
    
    const tId = currentTournament._id;
    // Organizer check must use .toString()
    const isOrganizer = currentTournament.organizer?._id?.toString() === currentUser.id;

    try {
        // 🚨 FIX: Use the globally provided app ID in the path
        const chatCollectionRef = collection(db, `artifacts/${firebaseAppId}/public/data/tournament_chats/${tId}/messages`);
        
        addDoc(chatCollectionRef, {
            text: messageText,
            username: currentUser.username || 'Anonymous',
            userId: currentUser.id,
            isOrganizer: isOrganizer,
            createdAt: serverTimestamp()
        });

        chatInput.value = '';
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
    }
}

function renderMessage(msg) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    const isMe = msg.userId === currentUser?.id;
    
    let userClass = 'message-other';
    if (isMe) {
        userClass = 'message-me';
    } else if (msg.isOrganizer) {
        userClass = 'message-organizer';
    }

    messageDiv.className = `message ${userClass}`;
    
    const time = msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString() : '...';
    
    messageDiv.innerHTML = `
        <span class="message-username">${msg.isOrganizer ? '👑' : ''} ${isMe ? 'You' : msg.username}</span>
        ${msg.text}
        <span style="float: right; font-size: 0.7rem; opacity: 0.6; margin-left: 10px;">${time}</span>
    `;

    chatMessages.appendChild(messageDiv);
}

function displayError(message) {
    console.error('❌ UI Error:', message);
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainGrid').style.display = 'none';
}