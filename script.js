// ===== DOM Elements =====
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const favoriteButtons = document.querySelectorAll('.favorite-btn');
const cartCount = document.getElementById('cartCount');
const profileBtn = document.getElementById('profileBtn');

// ===== Profile / Login Logic =====
if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Check if user is "connected" - for now we simulate NOT connected to show the page
        const isLoggedIn = localStorage.getItem('oslan_token');

        if (!isLoggedIn) {
            window.location.href = 'login.html';
        } else {
            // Redirect to profile page
            window.location.href = 'profil.html';
        }
    });
}

// ===== Sidebar Toggle =====
function openSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

if (menuBtn) menuBtn.addEventListener('click', openSidebar);
if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

// Close sidebar on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
        closeSidebar();
    }
});

// ===== Favorite Toggle =====
if (favoriteButtons.length > 0) {
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            btn.classList.toggle('active');

            // Add heart animation
            if (btn.classList.contains('active')) {
                btn.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 150);
            }
        });
    });
}


// ===== Cart Management =====
function safeJSONParse(str, fallback) {
    try {
        return str ? JSON.parse(str) : fallback;
    } catch (e) {
        console.error('Error parsing JSON from localStorage:', e);
        return fallback;
    }
}

function getCartCount() {
    const cart = localStorage.getItem('cart');
    if (cart) {
        const items = safeJSONParse(cart, []);
        return Array.isArray(items) ? items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
    }
    return parseInt(localStorage.getItem('cartItems') || '0');
}

function updateCartCount() {
    const count = getCartCount();
    if (cartCount) {
        cartCount.textContent = count;
        if (count > 0) {
            cartCount.classList.add('active');
        } else {
            cartCount.classList.remove('active');
        }
    }
}

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        e.preventDefault();
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            closeSidebar();
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300);
        }
    });
});

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe product cards
document.querySelectorAll('.product-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
});

// ===== Touch Gestures for Mobile =====
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;

    // Swipe right to open sidebar (from left edge)
    if (diff > swipeThreshold && touchStartX < 50) {
        openSidebar();
    }

    // Swipe left to close sidebar
    if (diff < -swipeThreshold && sidebar.classList.contains('active')) {
        closeSidebar();
    }
}

// ===== Carousel Active Slide Logic =====
// Removed: Descriptions are now always visible, no need for active slide detection

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Initial cart count update
    updateCartCount();

    console.log('OSLAN E-commerce site loaded successfully! 🚀');
});

// Handle bfcache (back-forward cache) - updates cart when user navigates back
window.addEventListener('pageshow', (event) => {
    // Always update cart count when page is shown (including from bfcache)
    updateCartCount();

    if (event.persisted) {
        console.log('Page restored from bfcache, cart count updated');
    }
});

// Sync cart count across tabs/windows when localStorage changes
window.addEventListener('storage', (event) => {
    if (event.key === 'cart' || event.key === 'cartItems') {
        updateCartCount();
        console.log('Cart synced from another tab');
    }
});

// Also update immediately in case script runs after DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updateCartCount();
}

// ===== Cookie Consent Popup =====
function initCookieConsent() {
    // Check if user has already made a choice
    if (localStorage.getItem('cookieConsent')) return;

    // Create popup HTML
    const popupHTML = `
        <div id="cookie-consent" class="cookie-popup">
            <div class="cookie-content">
                <h3>🍪 Cookies</h3>
                <p>Nous utilisons des cookies pour améliorer votre expérience sur OSLAN. En continuant, vous acceptez notre utilisation des cookies.</p>
                <div class="cookie-buttons">
                    <button id="btn-refuse" class="cookie-btn cookie-refuse">Refuser</button>
                    <button id="btn-accept" class="cookie-btn cookie-accept">Accepter</button>
                </div>
            </div>
        </div>
    `;

    // Inject into DOM
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    const popup = document.getElementById('cookie-consent');
    const btnAccept = document.getElementById('btn-accept');
    const btnRefuse = document.getElementById('btn-refuse');

    // Show popup with a small delay for animation effect
    setTimeout(() => {
        popup.classList.add('show');
    }, 1000);

    // Handle Accept
    btnAccept.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        popup.classList.remove('show');
        setTimeout(() => {
            popup.remove();
        }, 500);
        triggerConfetti();
    });

    // Handle Refuse
    btnRefuse.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'refused');
        popup.classList.remove('show');
        setTimeout(() => {
            popup.remove();
        }, 500);
    });
}

// ===== Confetti Animation =====
function triggerConfetti() {
    const colors = ['#ffffff', '#f4f4f4', '#e0e0e0', '#dcdcdc']; // White/Silver shades to match site theme
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '99999';
    document.body.appendChild(container);

    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.top = '-10px';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.width = Math.random() * 8 + 4 + 'px';
        confetti.style.height = Math.random() * 5 + 3 + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.opacity = Math.random() * 0.5 + 0.5;

        // Random falling animation
        const duration = Math.random() * 2 + 1.5; // between 1.5s and 3.5s
        const delay = Math.random() * 1;

        confetti.animate([
            { transform: `translate3d(0, 0, 0) rotate(0deg)` },
            { transform: `translate3d(${Math.random() * 100 - 50}px, 100vh, 0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            delay: delay * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        // Remove element after animation
        setTimeout(() => {
            confetti.remove();
        }, (duration + delay) * 1000);

        container.appendChild(confetti);
    }

    // Cleanup container
    setTimeout(() => {
        container.remove();
    }, 5000);
}



// Initialize cookie consent
document.addEventListener('DOMContentLoaded', initCookieConsent);
