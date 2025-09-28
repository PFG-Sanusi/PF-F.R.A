// Common JavaScript functionality for all pages

document.addEventListener('DOMContentLoaded', function() {
    // Initialize common functionality
    initializeNavigation();
    initializeForms();
    initializeAnimations();
    initializeAuth();
    initializeFAQ();
});

function initializeNavigation() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        navMenu.addEventListener('click', function(e) {
            if (e.target.closest('.nav-link')) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
    }
}

function initializeForms() {
    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
}

function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Show loading state
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    // Simulate form submission (replace with actual backend call)
    setTimeout(() => {
        console.log('Form submission data:', data);
        
        // Show success message
        showNotification('Thank you for your message! We will contact you within 24 hours.', 'success');
        
        // Reset form
        e.target.reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
    
    // In a real implementation, you would make an API call here:
    // fetch('/api/contact', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data)
    // })
    // .then(response => response.json())
    // .then(result => {
    //     showNotification('Thank you for your message! We will contact you soon.', 'success');
    //     e.target.reset();
    // })
    // .catch(error => {
    //     showNotification('Sorry, there was an error sending your message. Please try again.', 'error');
    // });
}

function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.service-card, .feature-item, .process-step, .faq-item').forEach(el => {
        observer.observe(el);
    });
}

function initializeFAQ() {
    // FAQ dropdown functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            // Make FAQ question focusable for keyboard navigation
            question.setAttribute('tabindex', '0');
            question.setAttribute('role', 'button');
            question.setAttribute('aria-expanded', 'false');
            
            const toggleFAQ = function() {
                const isActive = item.classList.contains('active');
                
                // Toggle active class on the FAQ item
                item.classList.toggle('active');
                
                // Update aria-expanded
                question.setAttribute('aria-expanded', !isActive);
                
                // Close other FAQ items (accordion behavior)
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherQuestion = otherItem.querySelector('.faq-question');
                        if (otherQuestion) {
                            otherQuestion.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
            };
            
            // Click event
            question.addEventListener('click', toggleFAQ);
            
            // Keyboard event (Enter and Space)
            question.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFAQ();
                }
            });
        }
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1rem;
        color: var(--text-primary);
        box-shadow: 0 4px 12px var(--shadow);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    // Set border color based on type
    const colors = {
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3'
    };
    notification.style.borderLeftColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'times-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
    }
    
    .notification-close:hover {
        color: var(--text-primary);
    }
    
    .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    .checkbox-label input[type="checkbox"] {
        display: none;
    }
    
    .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid var(--border-color);
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    .checkbox-label input[type="checkbox"]:checked + .checkmark {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }
    
    .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
        content: '✓';
        color: white;
        font-size: 12px;
        font-weight: bold;
    }
    
    .privacy-link {
        color: var(--primary-color);
        text-decoration: none;
    }
    
    .privacy-link:hover {
        text-decoration: underline;
    }
    
    .social-links {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border-color);
    }
    
    .social-icons {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .social-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 50%;
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.3s ease;
    }
    
    .social-link:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-2px);
    }
    
    .process-overview {
        margin-top: 4rem;
        padding: 3rem;
        background: var(--bg-tertiary);
        border-radius: 15px;
        border: 1px solid var(--border-color);
    }
    
    .process-steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }
    
    .process-step {
        text-align: center;
        padding: 1.5rem;
        background: var(--bg-secondary);
        border-radius: 10px;
        border: 1px solid var(--border-color);
    }
    
    .step-number {
        width: 50px;
        height: 50px;
        background: var(--primary-color);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: bold;
        margin: 0 auto 1rem;
    }
    
    .process-step h3 {
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
    
    .process-step p {
        color: var(--text-secondary);
    }
    
    .faq-section {
        margin-top: 4rem;
        padding: 3rem;
        background: var(--bg-tertiary);
        border-radius: 15px;
        border: 1px solid var(--border-color);
    }
    
    .faq-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }
    
    .faq-item {
        padding: 1.5rem;
        background: var(--bg-secondary);
        border-radius: 10px;
        border: 1px solid var(--border-color);
    }
    
    .faq-item h4 {
        color: var(--primary-color);
        margin-bottom: 1rem;
    }
    
    .faq-item p {
        color: var(--text-secondary);
        line-height: 1.6;
    }
`;
document.head.appendChild(style);

// User Authentication System
function initializeAuth() {
    // Check if user is already logged in
    loadUserFromStorage();
    updateAuthUI();
    bindAuthEvents();
}

function loadUserFromStorage() {
    const userData = localStorage.getItem('pf-fra-user');
    if (userData) {
        try {
            window.currentUser = JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('pf-fra-user');
        }
    }
}

function saveUserToStorage() {
    if (window.currentUser) {
        localStorage.setItem('pf-fra-user', JSON.stringify(window.currentUser));
    } else {
        localStorage.removeItem('pf-fra-user');
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const getStartedBtn = document.getElementById('getStartedBtn');

    if (window.currentUser) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userName) userName.textContent = window.currentUser.name;
        if (getStartedBtn) {
            getStartedBtn.innerHTML = '<i class="fas fa-map-marked-alt"></i><span>AOI Tool</span>';
            getStartedBtn.onclick = () => window.location.href = 'map.html';
        }
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'flex';
        if (registerBtn) registerBtn.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (getStartedBtn) {
            getStartedBtn.innerHTML = '<i class="fas fa-rocket"></i><span>Get Started</span>';
            getStartedBtn.onclick = () => showRegisterModal();
        }
    }
}

function bindAuthEvents() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showLoginModal());
    }

    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => showRegisterModal());
    }

    // User profile dropdown
    const userProfile = document.getElementById('userProfile');
    const userDropdown = document.getElementById('userDropdown');
    if (userProfile && userDropdown) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            userProfile.classList.toggle('active');
            userDropdown.classList.toggle('active');
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userDropdown && userProfile && !userProfile.contains(e.target)) {
            userProfile.classList.remove('active');
            userDropdown.classList.remove('active');
        }
    });
}

function showLoginModal() {
    createAuthModal('login');
}

function showRegisterModal() {
    createAuthModal('register');
}

function createAuthModal(type) {
    // Remove existing modal if any
    const existingModal = document.getElementById('authModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-modal-header">
                <h3>
                    <i class="fas fa-${type === 'login' ? 'sign-in-alt' : 'user-plus'}"></i>
                    ${type === 'login' ? 'Sign In' : 'Create Account'}
                </h3>
                <button class="auth-modal-close" onclick="this.closest('.auth-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="auth-modal-body">
                <form class="auth-form" id="authForm">
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" placeholder="Enter your password" required>
                    </div>
                    ${type === 'register' ? `
                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required>
                        </div>
                        <div class="form-group">
                            <label for="fullName">Full Name</label>
                            <input type="text" id="fullName" name="fullName" placeholder="Enter your full name" required>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="terms" name="terms" required>
                                <span class="checkmark"></span>
                                I agree to the <a href="#" style="color: var(--primary-500);">Terms of Service</a> and <a href="#" style="color: var(--primary-500);">Privacy Policy</a>
                            </label>
                        </div>
                    ` : ''}
                    <div class="auth-form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-${type === 'login' ? 'sign-in-alt' : 'user-plus'}"></i>
                            ${type === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.auth-modal').remove()">
                            Cancel
                        </button>
                    </div>
                    <div class="auth-switch">
                        ${type === 'login' 
                            ? 'Don\'t have an account? <a href="#" onclick="showRegisterModal(); this.closest(\'.auth-modal\').remove();">Create one</a>'
                            : 'Already have an account? <a href="#" onclick="showLoginModal(); this.closest(\'.auth-modal\').remove();">Sign in</a>'
                        }
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = document.getElementById('authForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (type === 'login') {
            handleLogin(form);
        } else {
            handleRegister(form);
        }
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function handleLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    // Simulate login validation
    if (email && password) {
        // In a real app, this would make an API call
        window.currentUser = {
            id: Date.now(),
            email: email,
            name: email.split('@')[0], // Use email prefix as name for demo
            loginTime: new Date().toISOString()
        };

        saveUserToStorage();
        updateAuthUI();
        
        // Close modal
        const modal = document.getElementById('authModal');
        if (modal) modal.remove();

        // Show success message
        showNotification('Welcome back! You are now signed in.', 'success');
    } else {
        showNotification('Please fill in all fields.', 'error');
    }
}

function handleRegister(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const fullName = formData.get('fullName');
    const terms = formData.get('terms');

    // Validation
    if (!email || !password || !confirmPassword || !fullName) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (!terms) {
        showNotification('Please accept the terms and conditions.', 'error');
        return;
    }

    // Simulate registration
    window.currentUser = {
        id: Date.now(),
        email: email,
        name: fullName,
        registerTime: new Date().toISOString()
    };

    saveUserToStorage();
    updateAuthUI();
    
    // Close modal
    const modal = document.getElementById('authModal');
    if (modal) modal.remove();

    // Show success message
    showNotification('Account created successfully! Welcome to PF-FRA.', 'success');
}

function logout() {
    window.currentUser = null;
    saveUserToStorage();
    updateAuthUI();
    showNotification('You have been signed out.', 'info');
}

function isLoggedIn() {
    return window.currentUser !== null;
}

function getCurrentUser() {
    return window.currentUser;
}
