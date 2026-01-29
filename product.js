// ===== Product Detail Page Script (Dynamic from Supabase) =====

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

    // ===== Get Product ID from URL or mapping =====
    // Note: The URL parameter 'id' currently uses slugs like 'tshirt-blanc'
    // But Supabase uses UUIDs. We need to handle this mapping or search by slug/title.
    const urlParams = new URLSearchParams(window.location.search);
    const productSlug = urlParams.get('id') || 'tshirt-blanc';

    // Store current product data - Initialize with DOM data (Fallback)
    let currentProduct = {
        id: productSlug, // Fallback ID
        title: productTitle ? productTitle.textContent : 'Produit Sans Nom',
        price: currentPrice ? parseFloat(currentPrice.textContent.replace('€', '').trim()) : 0,
        image_url: productImg1 ? productImg1.src : 'assets/logo.png',
        stock_quantity: 100, // Default generous stock if DB fails
        is_preorder: false
    };

    // Initialize UI immediately (Don't wait for DB)
    // updateUI(currentProduct); // Optional, HTML is already there

    // ===== Fetch Product Data from Supabase (Background Sync) =====
    async function fetchProductData() {
        const client = getSupabaseClient();
        if (!client) return;

        try {
            // Construct search term from slug (e.g. 'tshirt-blanc' -> 'blanc')
            const searchTerm = productSlug.includes('blanc') ? 'Blanc' : 'Noir';
            const genderTerm = productSlug.includes('femme') ? 'Femme' : 'Homme';

            // Fetch product
            const { data: products, error } = await client
                .from('products')
                .select('*')
                .ilike('title', `%${searchTerm}%`)
                .eq('category', genderTerm)
                .limit(1);

            if (error) {
                console.warn('DB Fetch silent error:', error);
                return; // Keep using DOM data
            }

            if (products && products.length > 0) {
                const dbProduct = products[0];
                // Merge DB info into currentProduct, but prioritising DB for critical logic
                currentProduct = {
                    ...currentProduct,
                    id: dbProduct.id, // Important: Use Real UUID
                    stock_quantity: dbProduct.stock_quantity,
                    is_preorder: dbProduct.is_preorder,
                    price: dbProduct.price, // Sync price
                    images: dbProduct.images, // New array
                    size_stock: dbProduct.size_stock // New JSON
                };

                // Update UI for Dynamic parts only
                if (currentPrice) currentPrice.textContent = `${dbProduct.price.toFixed(2)}€`;

                // Handle Gallery
                if (dbProduct.images && dbProduct.images.length > 0 && galleryTrack) {
                    galleryTrack.innerHTML = dbProduct.images.map((url, index) => `
                        <div class="gallery-slide" style="flex: 0 0 100%;">
                            <img src="${url}" alt="${dbProduct.title} - Vue ${index + 1}" style="width:100%; height:100%; object-fit:cover;">
                        </div>
                    `).join('');

                    // Update Dots
                    if (galleryDots) {
                        galleryDots.innerHTML = dbProduct.images.map((_, index) => `
                            <div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
                        `).join('');

                        // Re-attach listeners
                        galleryDots.querySelectorAll('.dot').forEach(dot => {
                            dot.addEventListener('click', () => {
                                currentSlide = parseInt(dot.dataset.index);
                                updateGallery();
                            });
                        });
                    }
                    // Reset slide
                    currentSlide = 0;
                    updateGallery(false);
                }

                // Handle Sizes
                updateSizeAvailability(dbProduct.size_stock, dbProduct.is_preorder);

                checkStock(dbProduct.stock_quantity, dbProduct.is_preorder); // Initial check (maybe based on default M)

                // Subscribe to Realtime changes
                subscribeToProductUpdates(dbProduct.id);
            } else {
                console.log('Product not linked in DB yet, using legacy mode.');
                // Enable purchase anyway
                checkStock(100, false);
            }

        } catch (err) {
            console.error('Error fetching product:', err);
        }
    }

    // New Helper for Size UI
    function updateSizeAvailability(sizeStock, isPreorder) {
        if (!sizeOptions) return;

        // If no strict size stock, assume legacy (all enabled)
        if (!sizeStock || Object.keys(sizeStock).length === 0) return;

        // Clear existing or Update existing?
        // Let's iterate existing buttons and update state
        const buttons = sizeOptions.querySelectorAll('.size-btn');
        buttons.forEach(btn => {
            const size = btn.dataset.size;
            const stock = sizeStock[size];

            // Logic:
            // If size is NOT in sizeStock (undefined), implies not configured/avail? Or allowed?
            // User checkbox logic: Unchecked = Disabled/Hidden.
            // So if undefined or null, we might want to hide it.
            // But if it's 0 and Preorder is FALSE => Disable.

            if (stock === undefined) {
                // Not configured in Admin -> Disable/Hide
                btn.classList.add('disabled');
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
                // If it was selected, deselect
                if (btn.classList.contains('active')) btn.classList.remove('active');
            } else {
                if (stock > 0 || isPreorder) {
                    btn.classList.remove('disabled');
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                } else {
                    // Out of stock and not preorder
                    btn.classList.add('disabled');
                    btn.style.opacity = '0.5';
                    btn.style.pointerEvents = 'none';
                    if (btn.classList.contains('active')) btn.classList.remove('active');
                }
            }
        });

        // Ensure at least one active if possible
        if (!sizeOptions.querySelector('.size-btn.active')) {
            const firstAvail = sizeOptions.querySelector('.size-btn:not(.disabled)');
            if (firstAvail) firstAvail.click();
            else {
                // No sizes? Disable add to cart
                checkStock(0, false);
            }
        }
    }

    // ===== Update UI (Reduced responsibility - mostly handled by HTML) =====
    // checkStock logic remains same but is now called after DB sync or fallback

    function checkStock(quantity, isPreorder) {
        if (addToCartBtn) {
            if (isPreorder) {
                // PRE-ORDER MODE
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = 'Précommander';
                addToCartBtn.classList.add('preorder-btn'); // Optional styling hook

                // Add badge if needed
                if (currentPrice && !document.querySelector('.preorder-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'status-badge warning preorder-badge';
                    badge.textContent = 'Pré-commande';
                    badge.style.marginLeft = '10px';
                    badge.style.fontSize = '0.8rem';
                    currentPrice.parentElement.appendChild(badge);
                }
            } else if (quantity > 0) {
                // IN STOCK
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = 'Ajouter au panier';
                addToCartBtn.classList.remove('preorder-btn');
                const badge = document.querySelector('.preorder-badge');
                if (badge) badge.remove();
            } else {
                // OUT OF STOCK
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = 'Rupture de stock';
                addToCartBtn.classList.remove('preorder-btn');
                const badge = document.querySelector('.preorder-badge');
                if (badge) badge.remove();

                // Also disable Buy Now button
                if (buyNowBtn) buyNowBtn.disabled = true;
            }
        }
    }

    // ===== Realtime Updates =====
    function subscribeToProductUpdates(productId) {
        const client = getSupabaseClient();
        if (!client) return;

        client
            .channel(`product-${productId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'products',
                filter: `id=eq.${productId}`
            }, (payload) => {
                const updatedProduct = payload.new;

                // Update critical data
                currentProduct.stock_quantity = updatedProduct.stock_quantity;
                currentProduct.is_preorder = updatedProduct.is_preorder;
                currentProduct.price = updatedProduct.price;
                currentProduct.size_stock = updatedProduct.size_stock;

                // Update UI elements
                if (currentPrice) currentPrice.textContent = `${updatedProduct.price.toFixed(2)}€`;

                // Live Stock & Pre-order Update
                updateSizeAvailability(updatedProduct.size_stock, updatedProduct.is_preorder);
                checkStock(updatedProduct.stock_quantity, updatedProduct.is_preorder);
            })
            .subscribe();
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

    // ===== Gallery Slider & Logic (Keeping existing logic) =====
    let currentSlide = 0;
    const slides = galleryTrack ? galleryTrack.querySelectorAll('.gallery-slide') : [];
    const dots = galleryDots ? galleryDots.querySelectorAll('.dot') : [];

    function updateGallery(animate = true) {
        if (galleryTrack) {
            galleryTrack.style.transition = animate ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
            galleryTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
        dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            currentSlide = parseInt(dot.dataset.index);
            updateGallery();
        });
    });

    // ===== Add/Buy Button Logic (Modified for DB) =====

    // Helper to get cart
    function getCart() {
        const cart = localStorage.getItem('cart');
        try { return cart ? JSON.parse(cart) : []; } catch { return []; }
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        localStorage.setItem('cartItems', totalItems.toString());
        // Trigger generic update event if needed or update badges
        const badges = document.querySelectorAll('.cart-count');
        badges.forEach(b => {
            b.textContent = totalItems;
            b.classList.toggle('active', totalItems > 0);
        });
    }

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if (!currentProduct) return; // Wait for data or fallback

            const selectedSizeBtn = document.querySelector('.size-btn.active');
            const size = selectedSizeBtn ? selectedSizeBtn.dataset.size : 'M';
            const cart = getCart();

            // Product to add
            // We use DB ID now for cleaner tracking, but fallback to slug for compatibility
            const productToAddID = currentProduct.id;

            const existingIndex = cart.findIndex(item => item.productId === productToAddID && item.size === size);

            if (existingIndex >= 0) {
                cart[existingIndex].quantity++;
            } else {
                cart.push({
                    productId: productToAddID, // Important: using DB ID
                    title: currentProduct.title, // Store title for cart display
                    // Use first image if array
                    image: (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images[0] : currentProduct.image_url,
                    price: currentProduct.price,
                    size: size,
                    quantity: 1,
                    isPreorder: currentProduct.is_preorder // Store pre-order status in cart
                });
            }

            saveCart(cart);

            // Animation/Confetti & Button Feedback

            // 1. Button Change
            const originalText = addToCartBtn.textContent;
            addToCartBtn.textContent = 'Ajouté !';
            addToCartBtn.classList.add('success');

            // 2. Confetti
            createConfetti();

            setTimeout(() => {
                addToCartBtn.classList.remove('success');
                // Restore correct text based on state
                checkStock(currentProduct.stock_quantity, currentProduct.is_preorder);
            }, 2000);
        });
    }

    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            if (addToCartBtn && !addToCartBtn.disabled) {
                addToCartBtn.click(); // Trigger add
                setTimeout(() => window.location.href = 'cart.html', 100);
            }
        });
    }

    function createConfetti() {
        const colors = ['#000000', '#333333', '#666666'];
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 8px; height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: 50%; left: 50%;
                pointer-events: none; opacity: 1;
                transform: translate(-50%, -50%);
                border-radius: 50%;
                z-index: 9999;
                transition: all 1s ease-out;
            `;
            document.body.appendChild(confetti);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;

            requestAnimationFrame(() => {
                confetti.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0)`;
                confetti.style.opacity = '0';
            });
            setTimeout(() => confetti.remove(), 1000);
        }
    }

    // ===== Initialize =====
    // Initialize Supabase Fetch
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fetchProductData);
    } else {
        fetchProductData();
    }

    // Also init gallery
    updateGallery();
}
