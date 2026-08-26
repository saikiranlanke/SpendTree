// js/navigation.js

function updateNavAuthUI(user) {
    const loginBtn = document.getElementById('navLoginBtn');
    const logoutBtn = document.getElementById('navLogoutBtn');
    const dashboardLink = document.getElementById('navDashboardLink');
    const analyticsLink = document.getElementById('navAnalyticsLink');
    const currentUserDisplay = document.getElementById('currentUserDisplay');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
        if (analyticsLink) analyticsLink.style.display = 'inline-block';

        if (currentUserDisplay) {
            currentUserDisplay.innerText = user.user_metadata?.full_name || user.email.split('@')[0];
        }

        if (typeof getCurrentUserFamilyProfile === 'function') {
            getCurrentUserFamilyProfile().then(profile => {
                if (profile?.families) {
                    const famNameEl = document.getElementById('familyNameDisplay');
                    const famCodeEl = document.getElementById('familyCodeDisplay');
                    if (famNameEl) famNameEl.innerText = profile.families.name;
                    if (famCodeEl) famCodeEl.innerText = profile.families.invite_code;
                }
            });
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (analyticsLink) analyticsLink.style.display = 'none';
        if (currentUserDisplay) currentUserDisplay.innerText = 'User';
    }
}

async function switchPage(pageId) {
    let user = null;
    if (typeof _supabase !== 'undefined' && _supabase?.auth) {
        try {
            const { data } = await _supabase.auth.getUser();
            user = data?.user || null;
        } catch (err) {
            console.error('Auth error:', err);
        }
    }

    if ((pageId === 'dashboard' || pageId === 'analytics') && !user) {
        pageId = 'login';
    }

    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('data-target') === pageId) a.classList.add('active');
    });

    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('open');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageId === 'dashboard' && user) {
        if (typeof populateCategoryDropdown === 'function') await populateCategoryDropdown();
        if (typeof loadDashboardData === 'function') await loadDashboardData();
    } else if (pageId === 'analytics' && user) {
        if (typeof initAnalyticsView === 'function') initAnalyticsView();
    }
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.toggle('open');
}

window.toggleMobileMenu = toggleMobileMenu;
window.updateNavAuthUI = updateNavAuthUI;
window.switchPage = switchPage;