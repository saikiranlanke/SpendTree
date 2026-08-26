// js/app.js

window.addEventListener('DOMContentLoaded', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Set date defaults across all input controls
    const dateInput = document.getElementById('expDate');
    if (dateInput) dateInput.value = today;

    const ledgerFilter = document.getElementById('ledgerDateFilter');
    if (ledgerFilter) ledgerFilter.value = today;

    const analyticsDayPicker = document.getElementById('analyticsDayPicker');
    if (analyticsDayPicker) analyticsDayPicker.value = today;

    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker) monthPicker.value = today.substring(0, 7);

    // Safely check active session on load
    let user = null;
    if (typeof _supabase !== 'undefined' && _supabase?.auth) {
        try {
            const { data } = await _supabase.auth.getUser();
            user = data?.user || null;
        } catch (err) {
            console.error('Error getting initial user session:', err);
        }
    }

    updateNavAuthUI(user);

    let isRecoveryFlow = false;
    if (typeof initPasswordRecoveryFlow === 'function') {
        isRecoveryFlow = initPasswordRecoveryFlow();
    }

    if (!isRecoveryFlow) {
        if (user) {
            switchPage('dashboard');
        } else {
            switchPage('home');
        }
    }
});

// js/app.js

// Global Toast Notification Helper
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
window.showToast = showToast;

// Global App Initialization
window.addEventListener('DOMContentLoaded', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Set date defaults across all input controls
    const dateInput = document.getElementById('expDate');
    if (dateInput) dateInput.value = today;

    const ledgerFilter = document.getElementById('ledgerDateFilter');
    if (ledgerFilter) ledgerFilter.value = today;

    const analyticsDayPicker = document.getElementById('analyticsDayPicker');
    if (analyticsDayPicker) analyticsDayPicker.value = today;

    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker) monthPicker.value = today.substring(0, 7);

    // Safely check active session on load
    let user = null;
    if (typeof _supabase !== 'undefined' && _supabase?.auth) {
        try {
            const { data } = await _supabase.auth.getUser();
            user = data?.user || null;
        } catch (err) {
            console.error('Error getting initial user session:', err);
        }
    }

    if (typeof updateNavAuthUI === 'function') updateNavAuthUI(user);

    let isRecoveryFlow = false;
    if (typeof initPasswordRecoveryFlow === 'function') {
        isRecoveryFlow = initPasswordRecoveryFlow();
    }

    if (!isRecoveryFlow) {
        if (user) {
            if (typeof switchPage === 'function') switchPage('dashboard');
        } else {
            if (typeof switchPage === 'function') switchPage('home');
        }
    }
});

// Function to handle "Get Started" click dynamically based on auth status
async function handleGetStarted() {
    let user = null;

    if (typeof _supabase !== 'undefined' && _supabase?.auth) {
        try {
            const { data } = await _supabase.auth.getUser();
            user = data?.user || null;
        } catch (err) {
            console.error('Error checking user session on Get Started:', err);
        }
    }

    if (user) {
        // User is logged in -> go to dashboard
        if (typeof switchPage === 'function') switchPage('dashboard');
    } else {
        // User is not logged in -> go to auth screen
        if (typeof switchPage === 'function') switchPage('login');
    }
}



// Attach to window so HTML inline onclick can access it
window.handleGetStarted = handleGetStarted;