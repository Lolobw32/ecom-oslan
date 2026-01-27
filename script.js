// ===== DOM Elements =====
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const favoriteButtons = document.querySelectorAll('.favorite-btn');
const cartCount = document.getElementById('cartCount');

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
