// ===== DOM Elements =====
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const cartCount = document.getElementById('cartCount');

// ===== Sidebar Toggle =====
function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

menuBtn.addEventListener('click', openSidebar);
closeBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Close sidebar on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        closeSidebar();
    }
});

// ===== Quick Add to Cart =====
const quickAddButtons = document.querySelectorAll('.quick-add-btn');

quickAddButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const productId = btn.dataset.product;
        if (!productId) return;

        // Get cart from localStorage
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');

        // Check if product already exists
        const existingIndex = cart.findIndex(item => item.productId === productId && item.size === 'M');

        if (existingIndex >= 0) {
            cart[existingIndex].quantity++;
        } else {
            cart.push({
                productId: productId,
                size: 'M', // Default size
                quantity: 1
            });
        }

        // Save cart
        localStorage.setItem('cart', JSON.stringify(cart));

        // Set flag for cart page confetti
        sessionStorage.setItem('showCartConfetti', 'true');

        // Update cart count
        updateCartCount();

        // Visual feedback - change + to checkmark
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.style.backgroundColor = '#1e7e34';
        btn.style.borderColor = '#1e7e34';

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
        }, 1200);
    });
});

// ===== Cart Management =====
function getCartCount() {
    const cart = localStorage.getItem('cart');
    if (cart) {
        const items = JSON.parse(cart);
        return items.reduce((sum, item) => sum + item.quantity, 0);
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

// ===== Page Exit Transitions =====
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');

        // Check if it's a link to an internal page and not an anchor link or new tab
        if (link && link.href && link.href.startsWith(window.location.origin) &&
            !link.getAttribute('href').startsWith('#') &&
            link.target !== '_blank' &&
            !e.ctrlKey && !e.metaKey) {

            e.preventDefault();
            const targetUrl = link.href;

            // Add exit animation class
            document.body.classList.add('page-exit');

            // Wait for animation then navigate
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 300); // Slightly less than CSS animation (0.4s) for snappier feel
        }
    });
});
