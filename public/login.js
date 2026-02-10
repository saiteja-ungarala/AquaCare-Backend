/**
 * AquaCare Login Page JavaScript
 * Handles form interactions, validation, and submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const loginBtn = loginForm.querySelector('.login-btn[type="submit"]');

    // ========== Password Visibility Toggle ==========
    if (togglePasswordBtn && passwordInput) {
        const eyeOpen = togglePasswordBtn.querySelector('.eye-open');
        const eyeClosed = togglePasswordBtn.querySelector('.eye-closed');

        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';

            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.setAttribute(
                'aria-label',
                isPassword ? 'Hide password' : 'Show password'
            );

            // Toggle icons
            if (eyeOpen && eyeClosed) {
                eyeOpen.style.display = isPassword ? 'none' : 'block';
                eyeClosed.style.display = isPassword ? 'block' : 'none';
            }

            // Highlight when visible
            togglePasswordBtn.style.color = isPassword ? '#19c3c0' : '';
        });
    }

    // ========== Form Submission ==========
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Basic validation
            if (!email || !password) {
                showError('Please fill in all fields');
                return;
            }

            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                emailInput.focus();
                return;
            }

            if (password.length < 6) {
                showError('Password must be at least 6 characters');
                passwordInput.focus();
                return;
            }

            // Show loading state
            setLoading(true);

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Store token
                    localStorage.setItem('authToken', data.data.token);

                    // Redirect to dashboard
                    window.location.href = '/dashboard.html';
                } else {
                    showError(data.message || 'Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Network error. Please check your connection.');
            } finally {
                setLoading(false);
            }
        });
    }

    // ========== Helper Functions ==========

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showError(message) {
        // Remove existing error
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.5);
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      animation: fadeIn 0.2s ease;
    `;

        // Insert at top of form
        loginForm.insertBefore(errorDiv, loginForm.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            errorDiv.style.transition = 'opacity 0.2s ease';
            setTimeout(() => errorDiv.remove(), 200);
        }, 5000);
    }

    function setLoading(isLoading) {
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoader = loginBtn.querySelector('.btn-loader');

        loginBtn.disabled = isLoading;

        if (btnText) btnText.style.display = isLoading ? 'none' : 'inline';
        if (btnLoader) btnLoader.style.display = isLoading ? 'inline-block' : 'none';
    }
});

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-0.5rem); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
