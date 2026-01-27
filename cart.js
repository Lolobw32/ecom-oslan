// ===== Cart Page Script =====

// ===== Product Data (same as product.js) =====
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

// ===== Cart Storage Functions =====
function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem('cartItems', totalItems.toString());

    // Update header badge if exists
    const cartCountHeader = document.getElementById('cartCountHeader');
    if (cartCountHeader) {
        cartCountHeader.textContent = totalItems;
    }

    // Update all cart badges on the page
    document.querySelectorAll('.cart-count').forEach(badge => {
        badge.textContent = totalItems;
        badge.classList.toggle('active', totalItems > 0);
    });
}

// ===== DOM Elements =====
const cartItemsContainer = document.getElementById('cartItems');
const emptyCart = document.getElementById('emptyCart');
const promoSection = document.getElementById('promoSection');
const orderSummary = document.getElementById('orderSummary');
const checkoutSection = document.getElementById('checkoutSection');
const subtotalEl = document.getElementById('subtotal');
const totalPriceEl = document.getElementById('totalPrice');
const checkoutTotalEl = document.getElementById('checkoutTotal');
const promoInput = document.getElementById('promoInput');
const promoBtn = document.getElementById('promoBtn');
const promoMessage = document.getElementById('promoMessage');
const backBtn = document.getElementById('backBtn');
const checkoutBtn = document.getElementById('checkoutBtn');

// Promo codes
const promoCodes = {
    'START': 0.15,
    'OSLAN10': 0.10,
    'OSLAN20': 0.20
};

let appliedPromo = null;

// ===== Render Cart =====
function renderCart() {
    const cart = getCart();

    if (cart.length === 0) {
        emptyCart.style.display = 'flex';
        cartItemsContainer.style.display = 'none';
        promoSection.style.display = 'none';
        orderSummary.style.display = 'none';
        checkoutSection.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartItemsContainer.style.display = 'block';
    promoSection.style.display = 'block';
    orderSummary.style.display = 'block';
    checkoutSection.style.display = 'block';

    cartItemsContainer.innerHTML = cart.map((item, index) => {
        const product = productData[item.productId] || {
            title: 'Produit inconnu',
            price: 0,
            image: 'assets/logo.png'
        };

        return `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-image">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${product.title}</h3>
                    <p class="cart-item-variant">Taille: ${item.size || 'M'}</p>
                    <div class="cart-item-price">${product.price}€</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="qty-btn" data-action="decrease" data-index="${index}">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" data-action="increase" data-index="${index}">+</button>
                    </div>
                    <button class="delete-btn" data-index="${index}" aria-label="Supprimer">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners
    cartItemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
    });

    cartItemsContainer.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });

    updateTotals();
}

// ===== Quantity Change =====
function handleQuantityChange(e) {
    const index = parseInt(e.target.dataset.index);
    const action = e.target.dataset.action;
    const cart = getCart();

    if (action === 'increase') {
        cart[index].quantity++;
    } else if (action === 'decrease') {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
        } else {
            cart.splice(index, 1);
        }
    }

    saveCart(cart);
    renderCart();
}

// ===== Delete Item =====
function handleDelete(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const cart = getCart();

    // Show confirmation
    const item = e.currentTarget.closest('.cart-item');
    item.classList.add('removing');

    setTimeout(() => {
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    }, 300);
}

// ===== Update Totals =====
function updateTotals() {
    const cart = getCart();
    let subtotal = 0;

    cart.forEach(item => {
        const product = productData[item.productId];
        if (product) {
            subtotal += product.price * item.quantity;
        }
    });

    let discount = 0;
    if (appliedPromo && promoCodes[appliedPromo]) {
        discount = subtotal * promoCodes[appliedPromo];
    }

    const shippingFee = subtotal >= 50 ? 0 : 4.99;
    const total = subtotal - discount + shippingFee;

    subtotalEl.textContent = `${subtotal.toFixed(2)}€`;
    document.getElementById('shippingFees').textContent = shippingFee === 0 ? 'Gratuit' : `${shippingFee.toFixed(2)}€`;
    totalPriceEl.textContent = `${total.toFixed(2)}€`;
    checkoutTotalEl.textContent = `${total.toFixed(2)}€`;

    // Update cart count in header
    const cartCountHeader = document.getElementById('cartCountHeader');
    if (cartCountHeader) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountHeader.textContent = totalItems;
    }
}

// ===== Promo Code =====
if (promoBtn) {
    promoBtn.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();

        if (promoCodes[code]) {
            appliedPromo = code;
            promoMessage.textContent = `✓ Code "${code}" appliqué (-${promoCodes[code] * 100}%)`;
            promoMessage.className = 'promo-message success';
            promoBtn.textContent = 'Appliqué';
            promoBtn.disabled = true;
            updateTotals();
        } else {
            promoMessage.textContent = '✗ Code invalide';
            promoMessage.className = 'promo-message error';
        }
    });
}

// ===== Navigation =====
if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    });
}

// ===== Checkout =====
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        const cart = getCart();
        if (cart.length > 0) {
            alert('Redirection vers le paiement...\n\nMerci pour votre commande OSLAN ! 🛍️');
            // In a real app: window.location.href = 'checkout.html';
        }
    });
}

// ===== Confetti Animation (same as product.js) =====
function createCartConfetti() {
    // Site colors: black and white only
    const colors = ['#1a1a1a', '#333333', '#666666', '#999999', '#ffffff'];
    const confettiCount = 60;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        // Start from random position at top of screen
        const startX = Math.random() * window.innerWidth;

        confetti.style.cssText = `
            position: fixed;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background-color: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${startX}px;
            top: -20px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(confetti);

        // Fall from top with slight horizontal movement
        const horizontalSpeed = Math.random() * 4 - 2;
        const fallSpeed = Math.random() * 3 + 4;
        let y = -20;
        let x = 0;
        let opacity = 1;
        let rotation = 0;
        const rotationSpeed = Math.random() * 10 - 5;

        function animate() {
            y += fallSpeed;
            x += horizontalSpeed;
            opacity -= 0.008;
            rotation += rotationSpeed;

            confetti.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            confetti.style.opacity = opacity;

            if (opacity > 0 && y < window.innerHeight + 50) {
                requestAnimationFrame(animate);
            } else {
                confetti.remove();
            }
        }

        setTimeout(() => requestAnimationFrame(animate), Math.random() * 500);
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateCartCount();

    // Check if we should show confetti (new product was added)
    if (sessionStorage.getItem('showCartConfetti') === 'true') {
        // Clear the flag so it doesn't show again on page refresh
        sessionStorage.removeItem('showCartConfetti');

        // Show confetti with a small delay for better effect
        setTimeout(() => {
            createCartConfetti();
        }, 300);
    }

    console.log('Cart page loaded! 🛒');

});
