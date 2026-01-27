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

    // ===== Add to Cart =====
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            // Get cart count from localStorage or initialize
            let cartItems = parseInt(localStorage.getItem('cartItems') || '0');
            cartItems++;
            localStorage.setItem('cartItems', cartItems.toString());

            // Animation feedback
            addToCartBtn.textContent = 'Ajouté ✓';
            addToCartBtn.style.backgroundColor = '#28a745';

            setTimeout(() => {
                addToCartBtn.textContent = 'Ajouter au panier';
                addToCartBtn.style.backgroundColor = '';
            }, 1500);
        });
    }

    // ===== Buy Now =====
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            // Add to cart and redirect to checkout
            let cartItems = parseInt(localStorage.getItem('cartItems') || '0');
            cartItems++;
            localStorage.setItem('cartItems', cartItems.toString());

            alert('Redirection vers le paiement...');
            // window.location.href = 'checkout.html';
        });
    }

    // ===== Initialize =====
    populateProductData();
    updateGallery();

    console.log('Product detail page loaded successfully! 🛍️');
}
