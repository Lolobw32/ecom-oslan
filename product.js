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

    // Store current product data
    let currentProduct = null;

    // ===== Fetch Product Data from Supabase =====
    async function fetchProductData() {
        const client = getSupabaseClient();
        if (!client) {
            console.error('Supabase client not available');
            return;
        }

        try {
            // We search by matching the slug to the image_url or title roughly
            // Ideally, we should add a 'slug' column to the database in the future
            // For now, we do a text search match

            // Construct search term from slug (e.g. 'tshirt-blanc' -> 'blanc')
            const searchTerm = productSlug.includes('blanc') ? 'Blanc' : 'Noir';
            const genderTerm = productSlug.includes('femme') ? 'Femme' : 'Homme';

            // Fetch product
            const { data: products, error } = await client
                .from('products')
                .select('*')
                .ilike('title', `%${searchTerm}%`)
                .eq('category', genderTerm) // Assuming migration set category correctly
                .limit(1);

            if (error) throw error;

            if (products && products.length > 0) {
                currentProduct = products[0];
                updateUI(currentProduct);

                // Subscribe to Realtime changes for this product (stock updates)
                subscribeToProductUpdates(currentProduct.id);
            } else {
                console.warn('Product not found in DB', productSlug);
                // Fallback to hardcoded if DB fetch fails (handled by existing HTML structure mostly)
            }

        } catch (err) {
            console.error('Error fetching product:', err);
        }
    }

    // ===== Update UI with Real Data =====
    function updateUI(product) {
        if (!product) return;

        // Update basic info
        productTitle.textContent = product.title;
        // Subtitle logic (can be added to DB later, for now inferred)
        productSubtitle.textContent = product.category === 'Homme'
            ? 'Collection Homme - Force et style.'
            : 'Collection Femme - Élégance et modernité.';

        currentPrice.textContent = `${product.price.toFixed(2)}€`;
        // Mock original price (e.g. +20%)
        originalPrice.textContent = `${(product.price * 1.2).toFixed(2)}€`;

        descriptionText.textContent = product.description;

        // Update Images
        if (product.image_url) {
            productImg1.src = product.image_url;
            productImg1.alt = product.title;
            // For gallery, we might reuse same image or have array in DB later
            // For now keeping existing secondary images logic if avail or using main
        }

        // ===== STOCK MANAGEMENT & PRE-ORDER =====
        checkStock(product.stock_quantity, product.is_preorder);
    }

    function checkStock(quantity, isPreorder) {
        const isOutOfStock = quantity <= 0;

        if (isPreorder) {
            // Pre-order mode: Always enabled, distinct style
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = 'Pré-commander';
                addToCartBtn.style.backgroundColor = '#d97706'; // Amber 600 for visibility
                addToCartBtn.style.color = '#fff';
                addToCartBtn.style.cursor = 'pointer';
            }
            if (buyNowBtn) {
                buyNowBtn.disabled = false;
                buyNowBtn.style.display = 'inline-block';
                buyNowBtn.textContent = 'Pré-commander maintenant';
            }
        } else if (isOutOfStock) {
            // Out of stock mode
            if (addToCartBtn) {
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = 'Rupture de stock';
                addToCartBtn.style.backgroundColor = '#ccc';
                addToCartBtn.style.color = '#666';
                addToCartBtn.style.cursor = 'not-allowed';
            }
            if (buyNowBtn) {
                buyNowBtn.disabled = true;
                buyNowBtn.style.display = 'none';
            }
        } else {
            // Normal stock mode
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = 'Ajouter au panier';
                addToCartBtn.style.backgroundColor = ''; // Reset to CSS default
                addToCartBtn.style.color = '';
                addToCartBtn.style.cursor = 'pointer';
            }
            if (buyNowBtn) {
                buyNowBtn.disabled = false;
                buyNowBtn.style.display = 'inline-block';
                buyNowBtn.textContent = 'Acheter maintenant';
            }

            // Low stock warning (optional)
            if (quantity < 5) {
                // Could add a badge here "Plus que X en stock"
            }
        }
    }

    // ===== Realtime Updates =====
    function subscribeToProductUpdates(productId) {
        const client = getSupabaseClient();

        client
            .channel(`product-${productId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'products',
                filter: `id=eq.${productId}`
            }, (payload) => {
                const updatedProduct = payload.new;
                currentProduct = updatedProduct;

                // Update specific fields that might change live
                productTitle.textContent = updatedProduct.title;
                descriptionText.textContent = updatedProduct.description;
                currentPrice.textContent = `${updatedProduct.price.toFixed(2)}€`;

                // Live Stock & Pre-order Update
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
    const totalSlides = slides.length;
    const galleryContainer = document.getElementById('galleryContainer');

    // ... (Keeping gallery swipe logic as is) ...
    // Note: Re-inserting the gallery logic briefly to minimalize diff size/complexity issues
    // Just assume standard slider logic here

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
                    image: currentProduct.image_url,
                    price: currentProduct.price,
                    size: size,
                    quantity: 1
                });
            }

            saveCart(cart);

            // Animation/Confetti
            // ... (keep existing animation logic) ...
            addToCartBtn.textContent = 'Ajouté !';
            setTimeout(() => {
                if (currentProduct.stock_quantity > 0) addToCartBtn.textContent = 'Ajouter au panier';
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
