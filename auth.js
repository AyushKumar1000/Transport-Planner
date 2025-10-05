// Firebase Google Authentication (Compat SDK)
// Assumes firebase-app-compat.js and firebase-auth-compat.js are loaded and firebase.initializeApp ran in config.js

(function () {
    const auth = firebase.auth();
    // Persist session in this browser (prevents sign-out on refresh)
    try {
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (e) {
        console.warn('Auth persistence setup warning:', e);
    }
    auth.useDeviceLanguage();
    // Email/Password auth

    const signInBtn = document.getElementById('signInBtn');
    const emailSignInBtn = document.getElementById('emailSignInBtn');
    const emailRegisterBtn = document.getElementById('emailRegisterBtn');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const signOutBtn = document.getElementById('signOutBtn');
    const userGreeting = document.getElementById('userGreeting');
    const userUid = document.getElementById('userUid');
    const signInScreen = document.getElementById('signInScreen');
    const appRoot = document.getElementById('appRoot');
    const authError = document.getElementById('authError');

    function updateUI(user) {
        if (user) {
            const displayName = user.displayName || user.email || 'User';
            userGreeting.textContent = `Signed in as ${displayName}`;
            userGreeting.style.display = 'inline-block';
            userUid.textContent = `UID: ${user.uid}`;
            userUid.style.display = 'inline-block';
            signInBtn.style.display = 'none';
            signOutBtn.style.display = 'inline-block';

            // Hide gate, show app
            if (signInScreen) signInScreen.style.display = 'none';
            if (appRoot) appRoot.style.display = 'block';
        } else {
            userGreeting.textContent = '';
            userGreeting.style.display = 'none';
            userUid.textContent = '';
            userUid.style.display = 'none';
            signInBtn.style.display = 'inline-block';
            signOutBtn.style.display = 'none';

            // Show gate, hide app until login
            if (signInScreen) signInScreen.style.display = 'flex';
            if (appRoot) appRoot.style.display = 'none';
        }
    }

    function showMessage(message, isError = true) {
        if (!authError) return;
        authError.textContent = message;
        authError.style.display = 'block';
        authError.style.color = isError ? '#b91c1c' : '#065f46';
    }

    function friendlyError(err) {
        const code = err && err.code ? String(err.code) : '';
        switch (code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Try signing in instead.';
            case 'auth/invalid-email':
                return 'Enter a valid email address.';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters.';
            case 'auth/user-not-found':
                return 'No account found for this email. Create a new account.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-login-credentials':
            case 'auth/invalid-credential':
                return 'Invalid email or password. If you are new, choose Create account.';
            case 'auth/operation-not-allowed':
                return 'Email/password sign-in is disabled in Firebase. Enable it in the Console.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please wait a moment and try again.';
            default:
                return (err && (err.message || err.toString())) || 'Something went wrong.';
        }
    }

    async function signInWithEmail() {
        try {
            const email = (emailInput?.value || '').trim();
            const password = passwordInput?.value || '';
            if (!email || !password) throw new Error('Please enter email and password.');
            await auth.signInWithEmailAndPassword(email, password);
            if (authError) authError.style.display = 'none';
        } catch (err) {
            console.error('Email sign-in failed:', err);
            showMessage(friendlyError(err), true);
        }
    }

    async function registerWithEmail() {
        try {
            const email = (emailInput?.value || '').trim();
            const password = passwordInput?.value || '';
            if (!email || !password) throw new Error('Please enter email and password.');
            if (password.length < 6) throw new Error('Password must be at least 6 characters.');
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            // Send verification (optional but recommended)
            try { await cred.user.sendEmailVerification(); } catch (e) { /* noop */ }
            showMessage('Account created. Verification email sent. You are now signed in.', false);
        } catch (err) {
            console.error('Registration failed:', err);
            showMessage(friendlyError(err), true);
        }
    }

    async function sendPasswordReset() {
        try {
            const email = (emailInput?.value || '').trim();
            if (!email) throw new Error('Enter your email to reset password.');
            await auth.sendPasswordResetEmail(email);
            showMessage('Password reset email sent.', false);
        } catch (err) {
            console.error('Password reset failed:', err);
            showMessage(friendlyError(err), true);
        }
    }

    async function signOut() {
        try {
            await auth.signOut();
        } catch (err) {
            console.error('Sign-out failed:', err);
            alert('Sign-out failed. Please try again.');
        }
    }

    // Bind events
    if (signInBtn) signInBtn.addEventListener('click', signInWithEmail);
    if (emailSignInBtn) emailSignInBtn.addEventListener('click', signInWithEmail);
    if (emailRegisterBtn) emailRegisterBtn.addEventListener('click', registerWithEmail);
    if (resetPasswordBtn) resetPasswordBtn.addEventListener('click', sendPasswordReset);
    if (signOutBtn) signOutBtn.addEventListener('click', signOut);

    // Listen to auth state changes
    auth.onAuthStateChanged(async (user) => {
        updateUI(user);
        // Optionally store basic profile in Firestore
        try {
            if (user && firebase.firestore) {
                const db = firebase.firestore();
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    displayName: user.displayName || null,
                    email: user.email || null,
                    photoURL: user.photoURL || null,
                    provider: 'google',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        } catch (e) {
            console.warn('Failed to write user profile:', e);
        }
    });
})();



