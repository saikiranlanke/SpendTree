// js/auth.js

let currentAuthMode = 'login';

function setPasswordResetMode(isResetMode) {
    currentAuthMode = isResetMode ? 'reset' : 'login';

    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authToggleText = document.getElementById('authToggleText');
    const authToggleLink = document.getElementById('authToggleLink');
    const registerFields = document.querySelectorAll('.register-field');
    const resetFields = document.querySelectorAll('.reset-password-field');
    const forgotWrapper = document.getElementById('forgotPasswordWrapper');

    setAuthFeedback('', false);

    if (currentAuthMode === 'reset') {
        if (authTitle) authTitle.innerText = 'Reset Your Password';
        if (authSubmitBtn) authSubmitBtn.innerText = 'Update Password';
        if (authToggleText) authToggleText.innerText = 'Remember your password?';
        if (authToggleLink) authToggleLink.innerText = 'Back to Sign In';
        if (forgotWrapper) forgotWrapper.style.display = 'none';
        registerFields.forEach(el => el.style.display = 'none');
        resetFields.forEach(el => el.style.display = 'block');
    } else {
        if (authTitle) authTitle.innerText = 'User Sign In';
        if (authSubmitBtn) authSubmitBtn.innerText = 'Sign In';
        if (authToggleText) authToggleText.innerText = "Don't have an account?";
        if (authToggleLink) authToggleLink.innerText = 'Register';
        if (forgotWrapper) forgotWrapper.style.display = 'block';
        registerFields.forEach(el => el.style.display = 'none');
        resetFields.forEach(el => el.style.display = 'none');
    }
}

function toggleAuthMode() {
    if (currentAuthMode === 'reset') {
        setPasswordResetMode(false);
        return;
    }

    currentAuthMode = currentAuthMode === 'login' ? 'register' : 'login';

    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authToggleText = document.getElementById('authToggleText');
    const authToggleLink = document.getElementById('authToggleLink');
    const registerFields = document.querySelectorAll('.register-field');
    const resetFields = document.querySelectorAll('.reset-password-field');
    const forgotWrapper = document.getElementById('forgotPasswordWrapper');

    setAuthFeedback('', false);

    if (currentAuthMode === 'register') {
        if (authTitle) authTitle.innerText = 'Create Family Account';
        if (authSubmitBtn) authSubmitBtn.innerText = 'Register & Join Family';
        if (authToggleText) authToggleText.innerText = 'Already have an account?';
        if (authToggleLink) authToggleLink.innerText = 'Sign In';
        if (forgotWrapper) forgotWrapper.style.display = 'none';
        registerFields.forEach(el => el.style.display = 'block');
        resetFields.forEach(el => el.style.display = 'none');
    } else {
        if (authTitle) authTitle.innerText = 'User Sign In';
        if (authSubmitBtn) authSubmitBtn.innerText = 'Sign In';
        if (authToggleText) authToggleText.innerText = "Don't have an account?";
        if (authToggleLink) authToggleLink.innerText = 'Register';
        if (forgotWrapper) forgotWrapper.style.display = 'block';
        registerFields.forEach(el => el.style.display = 'none');
        resetFields.forEach(el => el.style.display = 'none');
    }
}

function toggleFamilyInputs() {
    const option = document.querySelector('input[name="familyOption"]:checked')?.value;
    const nameGroup = document.getElementById('familyNameGroup');
    const codeGroup = document.getElementById('familyCodeGroup');

    if (option === 'join') {
        if (nameGroup) nameGroup.style.display = 'none';
        if (codeGroup) codeGroup.style.display = 'block';
    } else {
        if (nameGroup) nameGroup.style.display = 'block';
        if (codeGroup) codeGroup.style.display = 'none';
    }
}

function setAuthFeedback(message, isSuccess = false) {
    let feedbackEl = document.getElementById('authFeedback');
    if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.id = 'authFeedback';
        feedbackEl.style.cssText = 'margin-top: 1rem; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.9rem; text-align: center;';
        document.getElementById('authForm')?.appendChild(feedbackEl);
    }

    if (!message) {
        feedbackEl.style.display = 'none';
        return;
    }

    feedbackEl.style.display = 'block';
    feedbackEl.style.backgroundColor = isSuccess ? '#D1FAE5' : '#FEE2E2';
    feedbackEl.style.color = isSuccess ? '#065F46' : '#991B1B';
    feedbackEl.style.border = isSuccess ? '1px solid #10B981' : '1px solid #EF4444';
    feedbackEl.innerText = message;
}

async function submitPasswordReset() {
    const newPassword = document.getElementById('newPassword')?.value.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value.trim();

    if (!newPassword || !confirmPassword) {
        setAuthFeedback('Please enter and confirm your new password.', false);
        return;
    }

    if (newPassword.length < 6) {
        setAuthFeedback('Password must contain at least 6 characters.', false);
        return;
    }

    if (newPassword !== confirmPassword) {
        setAuthFeedback('New password and confirmation do not match.', false);
        return;
    }

    try {
        const { error } = await _supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;

        setAuthFeedback('Password updated successfully. You can now sign in with your new password.', true);
        document.getElementById('authForm')?.reset();
        setPasswordResetMode(false);
        if (typeof showToast === 'function') showToast('Password changed successfully!');

        const cleanUrl = new URL(window.location.href);
        cleanUrl.hash = '';
        cleanUrl.search = '';
        window.history.replaceState({}, '', cleanUrl.toString());
    } catch (err) {
        setAuthFeedback(err.message || 'Unable to update password right now.', false);
    }
}

async function handleAuth(event) {
    event.preventDefault();
    setAuthFeedback('', false);

    if (!_supabase) {
        setAuthFeedback('Supabase client is not initialized.', false);
        return;
    }

    if (currentAuthMode === 'reset') {
        await submitPasswordReset();
        return;
    }

    const email = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value.trim();

    if (!email || !password) {
        setAuthFeedback('Please fill in both email and password.', false);
        return;
    }

    if (currentAuthMode === 'register') {
        // Match the HTML element IDs (username & password)
        const email = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();
        const fullName = document.getElementById('fullName')?.value.trim() || 'Family Member';
        const familyOption = document.querySelector('input[name="familyOption"]:checked')?.value;
        const familyName = document.getElementById('familyNameInput')?.value.trim();
        const familyCode = document.getElementById('familyCodeInput')?.value.trim();

        if (!email || !password) {
            setAuthFeedback('Please fill in all required fields.', false);
            return;
        }
        if (familyOption === 'create' && !familyName) {
            setAuthFeedback('Please enter a family name.', false);
            return;
        }
        if (familyOption === 'join' && !familyCode) {
            setAuthFeedback('Please enter an invite code.', false);
            return;
        }

        try {
            // 1. Check if email already exists in profiles
            const { data: existingUser, error: checkError } = await _supabase
                .from('profiles')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (checkError) {
                console.error('Email check error:', checkError);
            }

            if (existingUser) {
                setAuthFeedback('Email address is already registered. Please sign in instead.', false);
                return;
            }

            // 2. Proceed with Supabase Auth SignUp
            const { data: authData, error: authError } = await _supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } }
            });

            if (authError) {
                // Catch native Supabase duplicate email error if RLS or timing allowed it through
                if (authError.message.toLowerCase().includes('already registered') || authError.status === 400) {
                    setAuthFeedback('Email address is already registered. Please sign in instead.', false);
                    return;
                }
                throw authError;
            }

            let user = authData?.user;
            if (!user) throw new Error("Registration failed.");

            // If automatic login/session creation is needed immediately after signup:
            if (!authData.session) {
                const { data: signInData, error: signInErr } = await _supabase.auth.signInWithPassword({ email, password });
                if (!signInErr && signInData.user) {
                    user = signInData.user;
                }
            }

            let familyId = null;

            // 3. Resolve Family ID (Create new family or Join existing via code)
            if (familyOption === 'create') {
                const { data: family, error: famError } = await _supabase
                    .from('families')
                    .insert([{ name: familyName }])
                    .select()
                    .single();
                if (famError) throw famError;
                familyId = family.id;
            } else {
                const { data: family, error: famError } = await _supabase
                    .from('families')
                    .select('id')
                    .eq('invite_code', familyCode)
                    .single();
                if (famError || !family) throw new Error("Invalid invite code. Family not found.");
                familyId = family.id;
            }

            // 4. Create Profile record linked to user & family
            const { error: profError } = await _supabase.from('profiles').upsert([{
                id: user.id,
                email: user.email,
                full_name: fullName,
                family_id: familyId
            }]);
            if (profError) throw profError;

            setAuthFeedback('Registration successful!', true);
            if (typeof showToast === 'function') showToast('Welcome to SpendTree!');

            setTimeout(async () => {
                document.getElementById('authForm')?.reset();
                if (typeof updateNavAuthUI === 'function') updateNavAuthUI(user);
                if (typeof switchPage === 'function') await switchPage('dashboard');
            }, 800);

        } catch (err) {
            setAuthFeedback(err.message, false);
        }
    } else {
        // Handle Login
        const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setAuthFeedback('Incorrect email or password.', false);
        } else {
            setAuthFeedback('Login successful!', true);
            if (typeof showToast === 'function') showToast('Welcome back!');
            setTimeout(async () => {
                document.getElementById('authForm')?.reset();
                if (typeof updateNavAuthUI === 'function') updateNavAuthUI(data.user);
                if (typeof switchPage === 'function') await switchPage('dashboard');
            }, 800);
        }
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('username')?.value.trim();
    if (!email) {
        setAuthFeedback('Please enter your email address first.', false);
        return;
    }

    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const { error } = await _supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
    });

    if (error) setAuthFeedback(error.message, false);
    else setAuthFeedback('Password reset link sent to your email!', true);
}

let recoveryLinkParams = null;

function parseRecoveryLink() {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);

    const type = hashParams.get('type') || queryParams.get('type');
    const access_token = hashParams.get('access_token') || queryParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token') || queryParams.get('refresh_token');
    const code = queryParams.get('code') || hashParams.get('code');

    const hasCredential = Boolean(access_token || refresh_token || code);
    if (!hasCredential) return null;

    // Reject links that explicitly belong to another email action (e.g. signup
    // confirmation). PKCE recovery redirects may arrive with only ?code=..., so
    // a missing type is treated as recovery.
    const otherEmailTypes = ['signup', 'email', 'invite', 'magiclink', 'sms', 'email_change', 'phone_change'];
    if (type && type !== 'recovery' && otherEmailTypes.includes(type)) return null;

    return { access_token, refresh_token, code };
}

function initPasswordRecoveryFlow() {
    if (!recoveryLinkParams) {
        const params = parseRecoveryLink();
        if (!params) return false;

        // Hold the recovery credential in memory only. No session is created here.
        recoveryLinkParams = params;

        // Immediately strip the token/code from the address bar and browser history.
        const cleanUrl = new URL(window.location.href);
        cleanUrl.hash = '';
        cleanUrl.search = '';
        window.history.replaceState({}, '', cleanUrl.toString());
    }

    if (typeof switchPage === 'function') switchPage('reset-password');
    return true;
}

async function submitResetPasswordForm(event) {
    if (event) event.preventDefault();

    const newPassword = document.getElementById('resetNewPassword')?.value;
    const confirmPassword = document.getElementById('resetConfirmPassword')?.value;
    const feedbackEl = document.getElementById('resetFeedback');

    const setFeedback = (message, isSuccess = false) => {
        if (!feedbackEl) return;
        if (!message) {
            feedbackEl.style.display = 'none';
            return;
        }
        feedbackEl.style.display = 'block';
        feedbackEl.style.backgroundColor = isSuccess ? '#D1FAE5' : '#FEE2E2';
        feedbackEl.style.color = isSuccess ? '#065F46' : '#991B1B';
        feedbackEl.style.border = isSuccess ? '1px solid #10B981' : '1px solid #EF4444';
        feedbackEl.style.marginTop = '1rem';
        feedbackEl.style.padding = '0.75rem';
        feedbackEl.style.borderRadius = '0.375rem';
        feedbackEl.style.textAlign = 'center';
        feedbackEl.innerText = message;
    };

    if (!newPassword || !confirmPassword) {
        setFeedback('Please enter and confirm your new password.', false);
        return;
    }
    if (newPassword.length < 6) {
        setFeedback('Password must contain at least 6 characters.', false);
        return;
    }
    if (newPassword !== confirmPassword) {
        setFeedback('New password and confirmation do not match.', false);
        return;
    }
    if (!_supabase || !recoveryLinkParams) {
        setFeedback('This password reset link is invalid or has expired. Please request a new one.', false);
        return;
    }

    const submitBtn = event?.target?.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setFeedback('Updating your password...', false);

    try {
        // Establish a session ONLY now, using the credential from the reset link.
        // Merely opening the link (a GET request) never creates a session or JWT.
        let sessionError = null;
        if (recoveryLinkParams.code) {
            const { error } = await _supabase.auth.exchangeCodeForSession(recoveryLinkParams.code);
            sessionError = error;
        } else if (recoveryLinkParams.access_token) {
            const { error } = await _supabase.auth.setSession({
                access_token: recoveryLinkParams.access_token,
                refresh_token: recoveryLinkParams.refresh_token
            });
            sessionError = error;
        } else {
            sessionError = { message: 'No recovery token found.' };
        }

        if (sessionError) {
            await _supabase.auth.signOut().catch(() => {});
            recoveryLinkParams = null;
            setFeedback('This password reset link is invalid or has expired. Please request a new one.', false);
            return;
        }

        // Update the password. Supabase validates the session/token, hashes the
        // new password securely, and invalidates the recovery code so it cannot be reused.
        const { error } = await _supabase.auth.updateUser({ password: newPassword });
        if (error) {
            await _supabase.auth.signOut().catch(() => {});
            recoveryLinkParams = null;
            setFeedback(error.message || 'Unable to update password right now.', false);
            return;
        }

        // Success: clear the recovery session and route to login with a success message.
        await _supabase.auth.signOut().catch(() => {});
        recoveryLinkParams = null;
        setFeedback('Password updated successfully. Please sign in with your new password.', true);
        if (typeof showToast === 'function') showToast('Password changed successfully!');

        setTimeout(async () => {
            document.getElementById('resetPasswordForm')?.reset();
            setFeedback('', false);
            if (typeof switchPage === 'function') await switchPage('login');
        }, 1500);
    } catch (err) {
        await _supabase.auth.signOut().catch(() => {});
        recoveryLinkParams = null;
        setFeedback(err.message || 'Unable to update password right now.', false);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function logoutUser() {
    if (_supabase) await _supabase.auth.signOut();
    if (typeof updateNavAuthUI === 'function') updateNavAuthUI(null);
    if (typeof switchPage === 'function') await switchPage('home');
}

window.toggleAuthMode = toggleAuthMode;
window.toggleFamilyInputs = toggleFamilyInputs;
window.handleAuth = handleAuth;
window.handleForgotPassword = handleForgotPassword;
window.initPasswordRecoveryFlow = initPasswordRecoveryFlow;
window.setPasswordResetMode = setPasswordResetMode;
window.submitResetPasswordForm = submitResetPasswordForm;
window.logoutUser = logoutUser;