// ===== Product Detail Page Script =====

// Check if we're on the product detail page
if (document.body.classList.contains('product-detail-page')) {

    // ===== DOM Elements =====
    const backBtn = document.getElementById('backBtn');
    const favoriteBtn = document.getElementById('favoriteBtn');
    const galleryTrack = document.getElementById('galleryTrack');
    const galleryDots = document.getElementById('galleryDots');
    const sizeOptions = document.getElementById('sizeOptions');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.getElementById('buyNowBtn');

    // Product elements
    const productTitle = document.getElementById('productTitle');
    const productSubtitle = document.getElementById('productSubtitle');
    const currentPrice = document.getElementById('currentPrice');
    const originalPrice = document.getElementById('originalPrice');
    const descriptionText = document.getElementById('descriptionText');
    const productImg1 = document.getElementById('productImg1');
    const productImg2 = document.getElementById('productImg2');
    const productImg3 = document.getElementById('productImg3');

    // ===== Product Data =====
    const products = {
        'tshirt-blanc': {
            title: 'T-shirt Signature Oslan Blanc',
            subtitle: 'Style élégant, qualité premium et confort intemporel.',
            currentPrice: '45€',
            originalPrice: '55€',
            description: 'Ce t-shirt blanc de la collection OSLAN offre un style élégant et sophistiqué pour toutes les occasions. Confectionné avec des matériaux premium en coton 100% biologique, il allie confort et durabilité. Coupe moderne et ajustée, parfait pour un look streetwear raffiné.',
            images: ['assets/tshirt-blanc.jpg', 'assets/hero.jpg', 'assets/carousel-1.jpg']
        },
        'tshirt-noir-femme': {
            title: 'T-shirt Signature Oslan Noir',
            subtitle: 'Collection Femme - Élégance et modernité.',
            currentPrice: '45€',
            originalPrice: '55€',
            description: 'Ce t-shirt noir de la collection OSLAN pour femme allie élégance et confort. Fabriqué avec du coton premium, il offre une coupe flatteuse et un style intemporel. Idéal pour un look casual chic ou streetwear sophistiqué.',
            images: ['assets/tshirt-noir-femme.jpg', 'assets/carousel-2.jpg', 'assets/hero.jpg']
        },
        'tshirt-noir-homme': {
            title: 'T-shirt Signature Oslan Noir',
            subtitle: 'Collection Homme - Force et style.',
            currentPrice: '45€',
            originalPrice: '55€',
            description: 'Ce t-shirt noir de la collection OSLAN pour homme incarne la force et le style. Confectionné avec des matériaux de haute qualité, il offre un confort optimal tout au long de la journée. Coupe ajustée moderne pour un look streetwear affirmé.',
            images: ['assets/tshirt-noir-homme.jpg', 'assets/carousel-3.jpg', 'assets/hero.jpg']
        },
        'tshirt-blanc-femme': {
            title: 'T-shirt Signature Oslan Blanc',
            subtitle: 'Collection Femme - Élégance et pureté.',
            currentPrice: '45€',
            originalPrice: '55€',
            description: 'Ce t-shirt blanc de la collection OSLAN pour femme incarne l\'élégance et la pureté. Fabriqué avec du coton premium 100% biologique, il offre une coupe flatteuse et un confort exceptionnel. Parfait pour un look casual chic ou streetwear raffiné.',
            images: ['assets/tshirt-blanc-femme.jpg', 'assets/tshirt-blanc.jpg', 'assets/carousel-1.jpg']
        }
    };

    // ===== Get Product ID from URL =====
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || 'tshirt-blanc';
    const product = products[productId] || products['tshirt-blanc'];

    // ===== Populate Product Data =====
    function populateProductData() {
        productTitle.textContent = product.title;
        productSubtitle.textContent = product.subtitle;
        currentPrice.textContent = product.currentPrice;
        originalPrice.textContent = product.originalPrice;
        descriptionText.textContent = product.description;

        productImg1.src = product.images[0];
        productImg2.src = product.images[1];
        productImg3.src = product.images[2];

        productImg1.alt = product.title + ' - Vue 1';
        productImg2.alt = product.title + ' - Vue 2';
        productImg3.alt = product.title + ' - Vue 3';
    }

    // ===== Back Button =====
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (document.referrer && document.referrer.includes(window.location.hostname)) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // ===== Favorite Button =====
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
            favoriteBtn.classList.toggle('active');

            if (favoriteBtn.classList.contains('active')) {
                favoriteBtn.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    favoriteBtn.style.transform = 'scale(1)';
                }, 150);
            }
        });
    }

    // ===== Gallery Slider =====
    let currentSlide = 0;
    const slides = galleryTrack ? galleryTrack.querySelectorAll('.gallery-slide') : [];
    const dots = galleryDots ? galleryDots.querySelectorAll('.dot') : [];
    const totalSlides = slides.length;
    const galleryContainer = document.getElementById('galleryContainer');

    // Swipe state
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let translateX = 0;

    function updateGallery(animate = true) {
        if (galleryTrack) {
            if (animate) {
                galleryTrack.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            } else {
                galleryTrack.style.transition = 'none';
            }
            galleryTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        }

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function goToSlide(index, animate = true) {
        currentSlide = index;
        if (currentSlide < 0) currentSlide = 0;
        if (currentSlide >= totalSlides) currentSlide = totalSlides - 1;
        updateGallery(animate);
    }

    // Dot navigation
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            goToSlide(index);
        });
    });

    // Touch gestures for gallery - improved with real-time tracking
    if (galleryContainer) {
        const getContainerWidth = () => galleryContainer.offsetWidth;

        galleryContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            translateX = -currentSlide * 100;
            galleryTrack.style.transition = 'none';
        }, { passive: true });

        galleryContainer.addEventListener('touchmove', (e) => {
            if (!isDragging) return;

            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            const containerWidth = getContainerWidth();
            const percentMove = (diff / containerWidth) * 100;

            // Apply real-time transform following finger
            galleryTrack.style.transform = `translateX(${translateX + percentMove}%)`;
        }, { passive: true });

        galleryContainer.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;

            const endX = e.changedTouches[0].clientX;
            const diff = endX - startX;
            const containerWidth = getContainerWidth();
            const swipeThreshold = containerWidth * 0.15; // 15% of width

            if (diff < -swipeThreshold && currentSlide < totalSlides - 1) {
                // Swipe left - next slide
                goToSlide(currentSlide + 1);
            } else if (diff > swipeThreshold && currentSlide > 0) {
                // Swipe right - previous slide
                goToSlide(currentSlide - 1);
            } else {
                // Snap back to current slide
                goToSlide(currentSlide);
            }
        }, { passive: true });

        // Mouse support for desktop testing
        galleryContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            translateX = -currentSlide * 100;
            galleryTrack.style.transition = 'none';
            galleryContainer.style.cursor = 'grabbing';
        });

        galleryContainer.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();

            currentX = e.clientX;
            const diff = currentX - startX;
            const containerWidth = getContainerWidth();
            const percentMove = (diff / containerWidth) * 100;

            galleryTrack.style.transform = `translateX(${translateX + percentMove}%)`;
        });

        galleryContainer.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            galleryContainer.style.cursor = 'grab';

            const diff = e.clientX - startX;
            const containerWidth = getContainerWidth();
            const swipeThreshold = containerWidth * 0.15;

            if (diff < -swipeThreshold && currentSlide < totalSlides - 1) {
                goToSlide(currentSlide + 1);
            } else if (diff > swipeThreshold && currentSlide > 0) {
                goToSlide(currentSlide - 1);
            } else {
                goToSlide(currentSlide);
            }
        });

        galleryContainer.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                galleryContainer.style.cursor = 'grab';
                goToSlide(currentSlide);
            }
        });
    }

    // ===== Size Selection =====
    if (sizeOptions) {
        const sizeButtons = sizeOptions.querySelectorAll('.size-btn');

        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // ===== Confetti Animation =====
    function createConfetti(button) {
        // Site colors: black and white only
        const colors = ['#1a1a1a', '#333333', '#666666', '#999999', '#ffffff'];
        const confettiCount = 40;

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

    // ===== Cart Storage Functions =====
    function getCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        localStorage.setItem('cartItems', totalItems.toString());
        updateCartBadge(totalItems);
    }

    function updateCartBadge(count) {
        document.querySelectorAll('.cart-count').forEach(badge => {
            badge.textContent = count;
            badge.classList.toggle('active', count > 0);
        });
    }

    // ===== Add to Cart =====
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            // Get selected size
            const selectedSize = document.querySelector('.size-btn.active');
            const size = selectedSize ? selectedSize.dataset.size : 'M';

            // Get current cart
            const cart = getCart();

            // Check if product already in cart with same size
            const existingIndex = cart.findIndex(item =>
                item.productId === productId && item.size === size
            );

            if (existingIndex >= 0) {
                cart[existingIndex].quantity++;
            } else {
                cart.push({
                    productId: productId,
                    size: size,
                    quantity: 1
                });
            }

            saveCart(cart);

            // Get total items for display
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

            // Create confetti explosion
            createConfetti(addToCartBtn);

            // Animation feedback with checkmark (darker green)
            addToCartBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            addToCartBtn.style.backgroundColor = '#1e7e34';

            setTimeout(() => {
                addToCartBtn.innerHTML = 'Ajouter au panier';
                addToCartBtn.style.backgroundColor = '';
            }, 1800);
        });
    }

    // ===== Buy Now =====
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            // Get selected size
            const selectedSize = document.querySelector('.size-btn.active');
            const size = selectedSize ? selectedSize.dataset.size : 'M';

            // Get current cart
            const cart = getCart();

            // Add product to cart
            const existingIndex = cart.findIndex(item =>
                item.productId === productId && item.size === size
            );

            if (existingIndex >= 0) {
                cart[existingIndex].quantity++;
            } else {
                cart.push({
                    productId: productId,
                    size: size,
                    quantity: 1
                });
            }

            saveCart(cart);

            // Redirect to cart
            window.location.href = 'cart.html';
        });
    }

    // ===== Initialize =====
    populateProductData();
    updateGallery();

    // Initialize cart badge on page load
    const initialCart = getCart();
    const initialCount = initialCart.reduce((sum, item) => sum + item.quantity, 0);
    updateCartBadge(initialCount);

    console.log('Product detail page loaded successfully! 🛍️');
}
