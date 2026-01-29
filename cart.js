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
function safeJSONParse(str, fallback) {
    try {
        return str ? JSON.parse(str) : fallback;
    } catch (e) {
        console.error('Error parsing JSON from localStorage:', e);
        return fallback;
    }
}

function getCart() {
    const cart = localStorage.getItem('cart');
    const parsed = safeJSONParse(cart, []);
    return Array.isArray(parsed) ? parsed : [];
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
                    <img src="${product.image}" alt="${product.title}" width="80" height="80" loading="lazy">
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

// ===== Checkout Popup =====
const checkoutPopupOverlay = document.getElementById('checkoutPopupOverlay');
const checkoutPopup = document.getElementById('checkoutPopup');
const checkoutPopupClose = document.getElementById('checkoutPopupClose');
const checkoutPrevBtn = document.getElementById('checkoutPrevBtn');
const checkoutNextBtn = document.getElementById('checkoutNextBtn');
const checkoutConfirmBtn = document.getElementById('checkoutConfirmBtn');
const checkoutSteps = document.querySelectorAll('.checkout-step');
const checkoutStepContents = document.querySelectorAll('.checkout-step-content');
const checkoutStepsIndicator = document.getElementById('checkoutStepsIndicator');
const checkoutPopupTitle = document.getElementById('checkoutPopupTitle');
const checkoutStepLogin = document.getElementById('checkoutStepLogin');

// Auth elements
const authLoginBtn = document.getElementById('authLoginBtn');
const authSignupBtn = document.getElementById('authSignupBtn');
const showSignupBtn = document.getElementById('showSignupBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const checkoutLoginForm = document.getElementById('checkoutLoginForm');
const checkoutSignupForm = document.getElementById('checkoutSignupForm');

let currentStep = 0; // 0 = login, 1-3 = checkout steps
let isAuthenticated = false;
let currentUser = null;
let checkoutMap = null;
let checkoutMarker = null;

// Open checkout popup
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        const cart = getCart();
        if (cart.length > 0) {
            await openCheckoutPopup();
        }
    });
}

async function openCheckoutPopup() {
    // Check if user is authenticated
    currentUser = await getCurrentUser();
    isAuthenticated = currentUser !== null;

    if (isAuthenticated) {
        currentStep = 1;
        // Pre-fill user email if available
        const emailInput = document.getElementById('checkoutEmail');
        if (emailInput && currentUser.email) {
            emailInput.value = currentUser.email;
        }
        // Try to load saved profile data
        await loadUserProfile();
    } else {
        currentStep = 0; // Show login step
    }

    updateStepUI();
    updateCheckoutSummary();

    checkoutPopupOverlay.classList.add('active');
    checkoutPopup.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize map
    setTimeout(() => {
        if (!checkoutMap) {
            initCheckoutMap();
        }
    }, 500);
}

// Load user profile from Supabase
async function loadUserProfile() {
    if (!currentUser) return;

    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data: profile } = await client
            .from('profiles')
            .select('first_name, last_name, phone, address, city, zip_code, country')
            .eq('id', currentUser.id)
            .single();

        if (profile) {
            // Pre-fill form fields
            if (profile.first_name) document.getElementById('checkoutFirstName').value = profile.first_name;
            if (profile.last_name) document.getElementById('checkoutLastName').value = profile.last_name;
            if (profile.phone) document.getElementById('checkoutPhone').value = profile.phone;
            if (profile.address) document.getElementById('checkoutAddress').value = profile.address;
            if (profile.city) document.getElementById('checkoutCity').value = profile.city;
            if (profile.zip_code) document.getElementById('checkoutZip').value = profile.zip_code;
            if (profile.country) document.getElementById('checkoutCountry').value = profile.country;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Save user profile to Supabase
async function saveUserProfile(customerInfo) {
    if (!currentUser) return;

    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { error } = await client
            .from('profiles')
            .upsert({
                id: currentUser.id,
                first_name: customerInfo.firstName,
                last_name: customerInfo.lastName,
                phone: customerInfo.phone,
                address: customerInfo.address,
                city: customerInfo.city,
                zip_code: customerInfo.zip,
                country: customerInfo.country,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) console.error('Error saving profile:', error);
    } catch (error) {
        console.error('Error saving profile:', error);
    }
}

function closeCheckoutPopup() {
    checkoutPopupOverlay.classList.remove('active');
    checkoutPopup.classList.remove('active');
    document.body.style.overflow = '';
}

// Close popup events
if (checkoutPopupClose) {
    checkoutPopupClose.addEventListener('click', closeCheckoutPopup);
}

if (checkoutPopupOverlay) {
    checkoutPopupOverlay.addEventListener('click', closeCheckoutPopup);
}

// Auth form toggle
if (showSignupBtn) {
    showSignupBtn.addEventListener('click', () => {
        checkoutLoginForm.classList.add('hidden');
        checkoutSignupForm.classList.remove('hidden');
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
        checkoutSignupForm.classList.add('hidden');
        checkoutLoginForm.classList.remove('hidden');
    });
}

// Login handler
if (authLoginBtn) {
    authLoginBtn.addEventListener('click', async () => {
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        const errorEl = document.getElementById('authError');

        if (!email || !password) {
            errorEl.textContent = 'Veuillez remplir tous les champs';
            return;
        }

        authLoginBtn.disabled = true;
        authLoginBtn.textContent = 'Connexion...';

        const { data, error } = await signInUser(email, password);

        if (error) {
            errorEl.textContent = error.message.includes('Invalid login')
                ? 'Email ou mot de passe incorrect'
                : error.message;
            authLoginBtn.disabled = false;
            authLoginBtn.textContent = 'Se connecter';
            return;
        }

        // Login successful
        currentUser = data.user;
        isAuthenticated = true;
        localStorage.setItem('oslan_token', 'true');

        // Pre-fill email and load profile
        const emailInput = document.getElementById('checkoutEmail');
        if (emailInput && currentUser.email) {
            emailInput.value = currentUser.email;
        }
        await loadUserProfile();

        // Move to step 1
        currentStep = 1;
        updateStepUI();

        authLoginBtn.disabled = false;
        authLoginBtn.textContent = 'Se connecter';
        errorEl.textContent = '';
    });
}

// Signup handler
if (authSignupBtn) {
    authSignupBtn.addEventListener('click', async () => {
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        const errorEl = document.getElementById('signupError');

        if (!email || !password || !passwordConfirm) {
            errorEl.textContent = 'Veuillez remplir tous les champs';
            return;
        }

        if (password !== passwordConfirm) {
            errorEl.textContent = 'Les mots de passe ne correspondent pas';
            return;
        }

        if (password.length < 6) {
            errorEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
            return;
        }

        authSignupBtn.disabled = true;
        authSignupBtn.textContent = 'Création...';

        const { data, error } = await signUpUser(email, password);

        if (error) {
            errorEl.textContent = error.message;
            authSignupBtn.disabled = false;
            authSignupBtn.textContent = 'Créer mon compte';
            return;
        }

        // Signup successful
        if (data.user) {
            currentUser = data.user;
            isAuthenticated = true;
            localStorage.setItem('oslan_token', 'true');

            // Pre-fill email
            const emailInput = document.getElementById('checkoutEmail');
            if (emailInput && currentUser.email) {
                emailInput.value = currentUser.email;
            }

            // Move to step 1
            currentStep = 1;
            updateStepUI();
        } else {
            // Email confirmation required
            errorEl.textContent = 'Vérifiez votre email pour confirmer votre compte';
            errorEl.style.color = '#4caf50';
        }

        authSignupBtn.disabled = false;
        authSignupBtn.textContent = 'Créer mon compte';
    });
}

// Step navigation
function updateStepUI() {
    // Show/hide login step
    if (currentStep === 0) {
        // On login step
        checkoutStepsIndicator.classList.add('hidden');
        checkoutPopupTitle.textContent = 'Connexion requise';
        checkoutStepLogin.classList.add('active');
        document.getElementById('checkoutStep1').classList.remove('active');
        document.getElementById('checkoutStep2').classList.remove('active');
        document.getElementById('checkoutStep3').classList.remove('active');
        checkoutPrevBtn.classList.add('hidden');
        checkoutNextBtn.classList.add('hidden');
        checkoutConfirmBtn.classList.add('hidden');
        return;
    }

    // Show steps indicator for checkout steps
    checkoutStepsIndicator.classList.remove('hidden');
    checkoutPopupTitle.textContent = 'Finaliser la commande';
    checkoutStepLogin.classList.remove('active');

    // Update step indicators
    checkoutSteps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        if (stepNum === currentStep) {
            step.classList.add('active');
        } else if (stepNum < currentStep) {
            step.classList.add('completed');
        }
    });

    // Update step contents
    document.getElementById('checkoutStep1').classList.toggle('active', currentStep === 1);
    document.getElementById('checkoutStep2').classList.toggle('active', currentStep === 2);
    document.getElementById('checkoutStep3').classList.toggle('active', currentStep === 3);

    // Update navigation buttons
    checkoutPrevBtn.classList.toggle('hidden', currentStep === 1);
    checkoutNextBtn.classList.toggle('hidden', currentStep === 3);
    checkoutConfirmBtn.classList.toggle('hidden', currentStep !== 3);
}

function validateCurrentStep() {
    if (currentStep === 1) {
        const firstName = document.getElementById('checkoutFirstName').value.trim();
        const lastName = document.getElementById('checkoutLastName').value.trim();
        const phone = document.getElementById('checkoutPhone').value.trim();
        const email = document.getElementById('checkoutEmail').value.trim();

        if (!firstName || !lastName || !phone || !email) {
            alert('Veuillez remplir tous les champs.');
            return false;
        }
        if (!email.includes('@')) {
            alert('Veuillez entrer une adresse email valide.');
            return false;
        }
        return true;
    }

    if (currentStep === 2) {
        const address = document.getElementById('checkoutAddress').value.trim();
        const city = document.getElementById('checkoutCity').value.trim();
        const zip = document.getElementById('checkoutZip').value.trim();
        const country = document.getElementById('checkoutCountry').value.trim();

        if (!address || !city || !zip || !country) {
            alert('Veuillez remplir tous les champs d\'adresse.');
            return false;
        }
        return true;
    }

    return true;
}

if (checkoutNextBtn) {
    checkoutNextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            currentStep++;
            updateStepUI();

            // Update map when going to step 2
            if (currentStep === 2) {
                setTimeout(updateMapLocation, 300);
            }
        }
    });
}

if (checkoutPrevBtn) {
    checkoutPrevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
        }
    });
}

// Payment method selection
document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
        method.classList.add('selected');
        method.querySelector('input[type="radio"]').checked = true;
    });
});

// Update checkout summary
function updateCheckoutSummary() {
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

    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutShipping = document.getElementById('checkoutShipping');
    const checkoutFinalTotal = document.getElementById('checkoutFinalTotal');

    if (checkoutSubtotal) checkoutSubtotal.textContent = `${subtotal.toFixed(2)}€`;
    if (checkoutShipping) checkoutShipping.textContent = shippingFee === 0 ? 'Gratuit' : `${shippingFee.toFixed(2)}€`;
    if (checkoutFinalTotal) checkoutFinalTotal.textContent = `${total.toFixed(2)}€`;
}

// Initialize Leaflet Map
function initCheckoutMap() {
    const mapContainer = document.getElementById('checkoutMap');
    if (!mapContainer || typeof L === 'undefined') return;

    // Default position (Paris)
    checkoutMap = L.map('checkoutMap').setView([48.8566, 2.3522], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(checkoutMap);

    mapContainer.classList.add('loaded');
}

// Update map based on address
function updateMapLocation() {
    const address = document.getElementById('checkoutAddress').value.trim();
    const city = document.getElementById('checkoutCity').value.trim();
    const zip = document.getElementById('checkoutZip').value.trim();
    const country = document.getElementById('checkoutCountry').value.trim();

    if (!address && !city) return;

    const fullAddress = `${address}, ${zip} ${city}, ${country}`;

    // Geocode using Nominatim (OpenStreetMap)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                if (checkoutMap) {
                    checkoutMap.setView([lat, lon], 15);

                    if (checkoutMarker) {
                        checkoutMarker.setLatLng([lat, lon]);
                    } else {
                        checkoutMarker = L.marker([lat, lon]).addTo(checkoutMap);
                    }

                    document.getElementById('checkoutMap').classList.add('loaded');
                }
            }
        })
        .catch(err => console.error('Geocoding error:', err));
}

// Debounced address change handler
let addressTimeout = null;
['checkoutAddress', 'checkoutCity', 'checkoutZip', 'checkoutCountry'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', () => {
            clearTimeout(addressTimeout);
            addressTimeout = setTimeout(updateMapLocation, 800);
        });
    }
});

// Confirm order
if (checkoutConfirmBtn) {
    checkoutConfirmBtn.addEventListener('click', async () => {
        const cart = getCart();
        if (cart.length === 0) return;

        checkoutConfirmBtn.disabled = true;
        checkoutConfirmBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"></circle>
            </svg>
            Traitement...
        `;

        // Collect customer info
        const customerInfo = {
            firstName: document.getElementById('checkoutFirstName').value.trim(),
            lastName: document.getElementById('checkoutLastName').value.trim(),
            phone: document.getElementById('checkoutPhone').value.trim(),
            email: document.getElementById('checkoutEmail').value.trim(),
            address: document.getElementById('checkoutAddress').value.trim(),
            city: document.getElementById('checkoutCity').value.trim(),
            zip: document.getElementById('checkoutZip').value.trim(),
            country: document.getElementById('checkoutCountry').value.trim(),
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card'
        };

        // Save profile for future use
        if (isAuthenticated) {
            await saveUserProfile(customerInfo);
        }

        if (window.oslanAnalytics) {
            const success = await window.oslanAnalytics.createOrder(cart, customerInfo);

            if (success) {
                closeCheckoutPopup();
                createCartConfetti();
                alert('🎉 Commande confirmée ! Merci de votre achat OSLAN.');
                localStorage.removeItem('cart');
                localStorage.removeItem('cartItems');
                window.location.href = 'index.html';
            } else {
                alert('Une erreur est survenue. Veuillez réessayer.');
                checkoutConfirmBtn.disabled = false;
                checkoutConfirmBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Confirmer la commande
                `;
            }
        } else {
            console.error('Analytics script not loaded');
            alert('Erreur technique. Veuillez recharger la page.');
            checkoutConfirmBtn.disabled = false;
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
