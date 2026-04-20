/**
 * SkySafe Authentication Module
 * Handles both Login and Registration in one file
 * Auto-detects page type based on form elements present
 * API Base URL: http://localhost:5000/api
 */

const API_BASE_URL = 'http://localhost:5000/api';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Display message to user
 * @param {string} elementId - ID of message element
 * @param {string} message - Message text
 * @param {string} type - 'success', 'error', or 'info'
 */
function showMessage(elementId, message, type = 'error') {
    const msgElement = document.getElementById(elementId);
    if (!msgElement) {
        console.warn(`Message element #${elementId} not found`);
        return;
    }
    
    msgElement.textContent = message;
    msgElement.style.display = 'block';
    
    // Remove old classes
    msgElement.className = 'msg-box';
    
    // Apply styling based on type
    if (type === 'success') {
        msgElement.style.color = '#28a745';
        msgElement.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        msgElement.style.border = '1px solid #28a745';
    } else if (type === 'error') {
        msgElement.style.color = '#dc3545';
        msgElement.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
        msgElement.style.border = '1px solid #dc3545';
    } else {
        msgElement.style.color = '#17a2b8';
        msgElement.style.backgroundColor = 'rgba(23, 162, 184, 0.1)';
        msgElement.style.border = '1px solid #17a2b8';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        msgElement.textContent = '';
        msgElement.style.display = 'none';
    }, 5000);
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check password strength
 * @param {string} password 
 * @returns {object} - { score: 0-5, label: string, color: string }
 */
function checkPasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const levels = [
        { label: 'Very Weak', color: '#ff4444' },
        { label: 'Weak', color: '#ff8844' },
        { label: 'Fair', color: '#ffaa44' },
        { label: 'Good', color: '#44aa44' },
        { label: 'Strong', color: '#44ff44' }
    ];
    
    const index = Math.max(0, Math.min(score - 1, 4));
    return {
        score: score,
        label: levels[index].label,
        color: levels[index].color,
        percent: (score / 5) * 100
    };
}

/**
 * Update password strength UI
 * @param {string} password 
 * @param {string} fillId - ID of strength fill element
 * @param {string} labelId - ID of strength label element
 */
function updateStrengthUI(password, fillId, labelId) {
    const fillEl = document.getElementById(fillId);
    const labelEl = document.getElementById(labelId);
    
    if (!fillEl) return;
    
    const strength = checkPasswordStrength(password);
    
    if (password.length === 0) {
        fillEl.style.width = '0%';
        if (labelEl) labelEl.textContent = '';
    } else {
        fillEl.style.width = `${strength.percent}%`;
        fillEl.style.backgroundColor = strength.color;
        if (labelEl) {
            labelEl.textContent = strength.label;
            labelEl.style.color = strength.color;
        }
    }
}

/**
 * Toggle password visibility
 * @param {string} inputId - Password input ID
 * @param {string} iconId - Eye icon ID
 */
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ==================== API CALLS ====================

/**
 * Register new user
 * @param {string} fullName 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>}
 */
async function registerUser(fullName, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                full_name: fullName,
                email: email,
                password: password
            })
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Registration API Error:', error);
        return {
            success: false,
            message: 'Network error. Please check if server is running on port 5000.'
        };
    }
}

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>}
 */
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Login API Error:', error);
        return {
            success: false,
            message: 'Network error. Please check if server is running on port 5000.'
        };
    }
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Save user session to localStorage
 * @param {object} userData 
 */
function saveUserSession(userData) {
    localStorage.setItem('skysafe_user', JSON.stringify(userData));
    localStorage.setItem('skysafe_logged_in', 'true');
    localStorage.setItem('skysafe_login_time', new Date().toISOString());
}

/**
 * Get current user from session
 * @returns {object|null}
 */
function getCurrentUser() {
    const user = localStorage.getItem('skysafe_user');
    return user ? JSON.parse(user) : null;
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
function isLoggedIn() {
    return localStorage.getItem('skysafe_logged_in') === 'true';
}

/**
 * Logout user and clear session
 * @param {string} redirectUrl - Where to redirect after logout
 */
function logout(redirectUrl = 'login.html') {
    localStorage.removeItem('skysafe_user');
    localStorage.removeItem('skysafe_logged_in');
    localStorage.removeItem('skysafe_login_time');
    window.location.href = redirectUrl;
}

/**
 * Redirect to login if not authenticated
 * @param {string} loginPage - Login page URL
 */
function requireAuth(loginPage = 'login.html') {
    if (!isLoggedIn()) {
        window.location.href = loginPage;
        return false;
    }
    return true;
}

/**
 * Redirect to dashboard if already logged in
 * @param {string} dashboardPage - Dashboard/main page URL
 */
function redirectIfAuth(dashboardPage = '../pages/forecast.html') {
    if (isLoggedIn()) {
        window.location.href = dashboardPage;
        return true;
    }
    return false;
}

// ==================== PAGE INITIALIZATION ====================

/**
 * Initialize Registration Page (newuser.html)
 */
function initRegistrationPage() {
    console.log('Initializing Registration Page...');
    
    const form = document.getElementById('form');
    if (!form) {
        console.error('Registration form not found');
        return;
    }

    // Get form fields
    const fnameInput = document.getElementById('fname');
    const emailInput = document.getElementById('email');
    const p1Input = document.getElementById('p1');
    const p2Input = document.getElementById('p2');
    
    // Check if all required fields exist
    if (!fnameInput || !emailInput || !p1Input || !p2Input) {
        console.error('Some registration fields are missing');
        return;
    }

    // Password strength meter
    p1Input.addEventListener('input', function() {
        updateStrengthUI(this.value, 'strengthFill', 'strengthLbl');
    });

    // Toggle password visibility
    const eyeBtn1 = document.getElementById('eyeBtn1');
    const eyeBtn2 = document.getElementById('eyeBtn2');
    
    if (eyeBtn1) {
        eyeBtn1.addEventListener('click', () => togglePasswordVisibility('p1', 'eyeIc1'));
    }
    if (eyeBtn2) {
        eyeBtn2.addEventListener('click', () => togglePasswordVisibility('p2', 'eyeIc2'));
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get values
        const fullName = fnameInput.value.trim();
        const email = emailInput.value.trim();
        const password = p1Input.value;
        const confirmPassword = p2Input.value;

        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
            showMessage('msg', 'Please fill in all fields', 'error');
            return;
        }

        if (fullName.length < 2) {
            showMessage('msg', 'Name must be at least 2 characters', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('msg', 'Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('msg', 'Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('msg', 'Passwords do not match', 'error');
            return;
        }

        // Loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Creating Account...</span> <i class="fas fa-spinner fa-spin"></i>';

        // API Call
        const result = await registerUser(fullName, email, password);

        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;

        if (result.success) {
            showMessage('msg', 'Account created! Redirecting...', 'success');
            saveUserSession(result.user);
            
            setTimeout(() => {
                window.location.href = '../pages/dashboard.html';
            }, 1500);
        } else {
            showMessage('msg', result.message || 'Registration failed', 'error');
        }
    });
}

/**
 * Initialize Login Page (login.html)
 */
function initLoginPage() {
    console.log('Initializing Login Page...');
    
    const form = document.getElementById('form');
    if (!form) {
        console.error('Login form not found');
        return;
    }

    // Get form fields (handle both possible ID variations)
    // Your login HTML uses id="Email" (capital E) and id="password"
    const emailInput = document.getElementById('Email') || document.getElementById('email');
    const passwordInput = document.getElementById('password') || document.getElementById('p1');
    
    if (!emailInput || !passwordInput) {
        console.error('Login fields not found. Email:', emailInput, 'Password:', passwordInput);
        return;
    }

    // Password strength (optional for login)
    if (document.getElementById('strengthFill')) {
        passwordInput.addEventListener('input', function() {
            updateStrengthUI(this.value, 'strengthFill', 'strengthLabel');
        });
    }

    // Toggle password visibility
    const toggleBtn = document.getElementById('toggleP1');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => togglePasswordVisibility('password', 'eyeIcon1'));
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validation
        if (!email || !password) {
            showMessage('msg', 'Please enter both email and password', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('msg', 'Please enter a valid email address', 'error');
            return;
        }

        // Loading state
        const submitBtn = document.getElementById('n') || form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Logging in...</span> <i class="fas fa-spinner fa-spin"></i>';

        // API Call
        const result = await loginUser(email, password);

        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;

        if (result.success) {
            showMessage('msg', 'Login successful! Redirecting...', 'success');
            saveUserSession(result.user);
            
            setTimeout(() => {
                window.location.href = '../pages/dashboard.html';
            }, 1000);
        } else {
            showMessage('msg', result.message || 'Invalid credentials', 'error');
        }
    });
}

/**
 * Initialize Session (for all pages)
 */
function initSession() {
    // Update UI with user info if elements exist
    const user = getCurrentUser();
    if (user) {
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.full_name;
        });
        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = user.email;
        });
    }

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// ==================== AUTO-DETECT PAGE TYPE ====================

/**
 * Main Initialization - Auto-detects page type and initializes accordingly
 */
function initSkySafeAuth() {
    console.log('SkySafe Auth Initializing...');
    
    // Check which page we're on by looking for specific elements
    const hasFname = document.getElementById('fname'); // Registration page has fname
    const hasConfirmPassword = document.getElementById('p2'); // Registration has p2 (confirm)
    const hasEmailField = document.getElementById('email') || document.getElementById('Email');
    
    if (hasFname && hasConfirmPassword) {
        // This is the registration page
        console.log('Detected: Registration Page');
        
        if (isLoggedIn()) {
            window.location.href = '../pages/dashboard.html';
            return;
        }
        
        initRegistrationPage();
        
    } else if (hasEmailField && !hasFname) {
        // This is the login page
        console.log('Detected: Login Page');
        
        if (isLoggedIn()) {
            window.location.href = '../pages/dashboard.html';
            return;
        }
        
        initLoginPage();
    }
    
    // Initialize common session features for all pages
    initSession();
}

// ==================== START ON DOM READY ====================

// Run when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkySafeAuth);
} else {
    // DOMContentLoaded has already fired
    initSkySafeAuth();
}

// Make functions available globally for inline usage
window.SkySafeAuth = {
    login: loginUser,
    register: registerUser,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getUser: getCurrentUser,
    requireAuth: requireAuth,
    redirectIfAuth: redirectIfAuth,
    showMessage: showMessage
};
// Logout button handler
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});