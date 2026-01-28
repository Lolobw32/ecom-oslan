// ===== Profile Page Script =====

// ===== Product Data (same as cart.js) =====
const productData = {
    'tshirt-blanc': {
        title: 'T-shirt Signature Oslan Blanc',
        price: 45,
        originalPrice: 55,
        image: 'assets/tshirt-blanc.jpg'
    },
    'tshirt-noir-femme': {
        title: 'T-shirt Signature Oslan Noir',
        price: 45,
        originalPrice: 55,
        image: 'assets/tshirt-noir-femme.jpg'
    },
    'tshirt-noir-homme': {
        title: 'T-shirt Signature Oslan Noir',
        price: 45,
        originalPrice: 55,
        image: 'assets/tshirt-noir-homme.jpg'
    },
    'tshirt-blanc-femme': {
        title: 'T-shirt Signature Oslan Blanc',
        price: 45,
        originalPrice: 55,
        image: 'assets/tshirt-blanc-femme.jpg'
    }
};

// Demo data for tracking and orders
const demoTrackingData = [
    {
        id: 'OSL240128001',
        status: 'transit',
        statusText: 'En transit',
        from: 'Paris',
        to: 'Lyon',
        fromDate: '28 Janvier 2026',
        toDate: '31 Janvier 2026',
        progress: 60
    },
    {
        id: 'OSL240125002',
        status: 'delivered',
        statusText: 'Livré',
        from: 'Bordeaux',
        to: 'Marseille',
        fromDate: '25 Janvier 2026',
        toDate: '27 Janvier 2026',
        progress: 100
    }
];

const demoOrdersData = [
    {
        id: 'OSL240128001',
        date: '28 Janvier 2026',
        status: 'shipping',
        statusText: 'En livraison',
        items: [
            { productId: 'tshirt-blanc', size: 'M', quantity: 1 }
        ],
        total: 45
    },
    {
        id: 'OSL240120003',
        date: '20 Janvier 2026',
        status: 'completed',
        statusText: 'Terminée',
        items: [
            { productId: 'tshirt-noir-femme', size: 'S', quantity: 2 }
        ],
        total: 90
    }
];

// ===== Cart Storage Functions =====
function safeJSONParse(str, fallback) {
    try {
        return str ? JSON.parse(str) : fallback;
    } catch (e) {
        return fallback;
    }
}

function getCart() {
    const cart = localStorage.getItem('cart');
    const parsed = safeJSONParse(cart, []);
    return Array.isArray(parsed) ? parsed : [];
}

// ===== DOM Elements =====
const profileName = document.getElementById('profileName');
const profileLocation = document.getElementById('profileLocation');
const mainTitle = document.getElementById('mainTitle');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const logoutBtn = document.getElementById('logoutBtn');

// Tracking elements
const trackingEmpty = document.getElementById('trackingEmpty');
const trackingList = document.getElementById('trackingList');

// Cart elements
const cartEmptyProfile = document.getElementById('cartEmptyProfile');
const cartListProfile = document.getElementById('cartListProfile');

// Orders elements
const ordersEmpty = document.getElementById('ordersEmpty');
const ordersList = document.getElementById('ordersList');

// ===== Load User Data =====
async function loadUserData() {
    try {
        const user = await getCurrentUser();
        if (user) {
            // Get user metadata
            const metadata = user.user_metadata || {};
            const firstName = metadata.first_name || metadata.firstName || '';
            const lastName = metadata.last_name || metadata.lastName || '';

            if (firstName || lastName) {
                profileName.textContent = `${firstName} ${lastName}`.trim();
            } else {
                // Use email as fallback
                profileName.textContent = user.email.split('@')[0];
            }
            profileLocation.textContent = metadata.city || 'France';
        } else {
            // Not logged in - redirect to login
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        profileName.textContent = 'Utilisateur';
    }
}

// ===== Tab Navigation =====
function initTabs() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active button
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');

            // Update main title based on tab
            switch (tabName) {
                case 'tracking':
                    mainTitle.textContent = 'Mes Livraisons';
                    break;
                case 'cart':
                    mainTitle.textContent = 'Mon Panier';
                    break;
                case 'orders':
                    mainTitle.textContent = 'Mes Commandes';
                    break;
            }
        });
    });
}

// ===== Render Tracking Cards =====
function renderTracking() {
    // For demo, we use demoTrackingData
    // In production, this would come from Supabase
    const trackingData = demoTrackingData;

    if (trackingData.length === 0) {
        trackingEmpty.style.display = 'flex';
        trackingList.style.display = 'none';
        return;
    }

    trackingEmpty.style.display = 'none';
    trackingList.style.display = 'flex';

    trackingList.innerHTML = trackingData.map(item => `
        <div class="tracking-card ${item.status}">
            <div class="tracking-header">
                <span class="tracking-status ${item.status}">${item.statusText}</span>
                <button class="tracking-arrow" aria-label="Détails">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                </button>
            </div>
            
            <div class="tracking-timeline">
                <div class="timeline-line">
                    <div class="timeline-progress" style="width: ${item.progress}%"></div>
                </div>
                <div class="timeline-dots">
                    <span class="timeline-dot active"></span>
                    <span class="timeline-dot ${item.progress >= 30 ? 'active' : ''}"></span>
                    <span class="timeline-dot ${item.progress >= 60 ? 'active' : ''}"></span>
                    <span class="timeline-dot ${item.progress >= 100 ? 'active' : ''}"></span>
                </div>
            </div>
            
            <div class="tracking-locations">
                <div class="tracking-from">
                    <span class="location-label">De</span>
                    <span class="location-city">${item.from}</span>
                    <span class="location-date">${item.fromDate}</span>
                </div>
                <div class="tracking-to">
                    <span class="location-label">À</span>
                    <span class="location-city">${item.to}</span>
                    <span class="location-date">${item.toDate}</span>
                </div>
            </div>
            
            <div class="tracking-footer">
                <span class="tracking-id">ID: ${item.id}</span>
                <div class="tracking-icon">
                    <img src="assets/logo.png" alt="OSLAN" width="40" height="40">
                </div>
                <button class="tracking-detail-btn" aria-label="Voir les détails">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ===== Render Cart Items =====
function renderCartProfile() {
    const cart = getCart();

    if (cart.length === 0) {
        cartEmptyProfile.style.display = 'flex';
        cartListProfile.style.display = 'none';
        return;
    }

    cartEmptyProfile.style.display = 'none';
    cartListProfile.style.display = 'flex';

    let total = 0;

    cartListProfile.innerHTML = cart.map((item, index) => {
        const product = productData[item.productId] || {
            title: 'Produit inconnu',
            price: 0,
            image: 'assets/logo.png'
        };
        total += product.price * item.quantity;

        return `
            <div class="cart-item-profile">
                <div class="cart-item-image-profile">
                    <img src="${product.image}" alt="${product.title}" width="70" height="70" loading="lazy">
                </div>
                <div class="cart-item-details-profile">
                    <h3 class="cart-item-title-profile">${product.title}</h3>
                    <p class="cart-item-variant-profile">Taille: ${item.size || 'M'} • Qté: ${item.quantity}</p>
                    <div class="cart-item-price-profile">${product.price}€</div>
                </div>
            </div>
        `;
    }).join('');

    // Add total
    cartListProfile.innerHTML += `
        <div class="cart-total-profile">
            <span>Total</span>
            <span class="cart-total-amount">${total}€</span>
        </div>
        <a href="cart.html" class="btn-view-cart">Voir le panier complet</a>
    `;
}

// ===== Render Orders =====
function renderOrders() {
    // For demo, we use demoOrdersData
    const ordersData = demoOrdersData;

    if (ordersData.length === 0) {
        ordersEmpty.style.display = 'flex';
        ordersList.style.display = 'none';
        return;
    }

    ordersEmpty.style.display = 'none';
    ordersList.style.display = 'flex';

    ordersList.innerHTML = ordersData.map(order => {
        const itemsHtml = order.items.map(item => {
            const product = productData[item.productId] || { title: 'Produit', image: 'assets/logo.png' };
            return `
                <div class="order-item">
                    <img src="${product.image}" alt="${product.title}" width="50" height="50">
                    <div class="order-item-info">
                        <span class="order-item-name">${product.title}</span>
                        <span class="order-item-details">Taille ${item.size} × ${item.quantity}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="order-card ${order.status}">
                <div class="order-header">
                    <div class="order-info">
                        <span class="order-id">Commande #${order.id}</span>
                        <span class="order-date">${order.date}</span>
                    </div>
                    <span class="order-status ${order.status}">${order.statusText}</span>
                </div>
                <div class="order-items">
                    ${itemsHtml}
                </div>
                <div class="order-footer">
                    <span class="order-total">Total: ${order.total}€</span>
                    ${order.status === 'shipping' ? '<button class="order-track-btn">Suivre</button>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ===== Logout =====
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOutUser();
            localStorage.removeItem('oslan_token');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect anyway
            localStorage.removeItem('oslan_token');
            window.location.href = 'index.html';
        }
    });
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    initTabs();
    renderTracking();
    renderCartProfile();
    renderOrders();

    console.log('Profile page loaded! 👤');
});
