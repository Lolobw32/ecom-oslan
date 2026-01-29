/**
 * OSLAN Analytics & Data Sync
 * Gère le tracking des visiteurs et la synchronisation des commandes avec Supabase
 */

// ===== ANALYTICS TRACKING =====
async function initAnalytics() {
    const client = getSupabaseClient();
    if (!client) return;

    // 1. Track Page View
    try {
        // Generate or get visitor ID
        let visitorId = localStorage.getItem('oslan_visitor_id');
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem('oslan_visitor_id', visitorId);
        }

        // Track view
        await client.from('analytics').insert([{
            event_type: 'page_view',
            visitor_id: visitorId,
            metadata: {
                path: window.location.pathname,
                referrer: document.referrer,
                user_agent: navigator.userAgent
            }
        }]);

        // 2. Realtime Presence (Live Visitors)
        const channel = client.channel('room_visitors');
        channel
            .on('presence', { event: 'sync' }, () => {
                // Optional: You could show "X people viewing" on product pages
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        visitor_id: visitorId,
                        page: window.location.pathname
                    });
                }
            });

    } catch (error) {
        console.error('Analytics error:', error);
    }
}

// ===== ORDER SYNC =====
async function createOrder(cartItems, customerInfo) {
    const client = getSupabaseClient();
    if (!client) {
        alert('Erreur de connexion. Veuillez réessayer.');
        return false;
    }

    try {
        // 1. Fetch products to get real prices and IDs
        const { data: products, error: prodError } = await client.from('products').select('id, title, price, image_url');

        if (prodError || !products) {
            console.error('Error fetching products during order:', prodError);
            alert('Erreur technique (Produits). Contactez le support.');
            return false;
        }

        // 2. Check Auth (Optional for guest checkout, but used if avail)
        const { data: { user } } = await client.auth.getUser();
        let userId = user ? user.id : null;

        // 3. Process Cart Items
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of cartItems) {
            let dbProduct = null;

            // A. Try Direct ID Match (UUID)
            dbProduct = products.find(p => p.id === item.productId);

            // B. Fallback: Fuzzy Match by Title/Slug (for legacy cart items)
            if (!dbProduct) {
                const searchStr = String(item.productId).toLowerCase().replace(/-/g, ' ');
                // Prioritize exact partial match on title
                dbProduct = products.find(p => p.title.toLowerCase().includes(searchStr));

                // Extra fallback for known keywords
                if (!dbProduct) {
                    if (searchStr.includes('blanc')) dbProduct = products.find(p => p.title.toLowerCase().includes('blanc'));
                    else if (searchStr.includes('noir')) dbProduct = products.find(p => p.title.toLowerCase().includes('noir'));
                }
            }

            if (dbProduct) {
                const itemTotal = dbProduct.price * item.quantity;
                totalAmount += itemTotal;
                orderItemsData.push({
                    product_id: dbProduct.id,
                    quantity: item.quantity,
                    price_at_purchase: dbProduct.price,
                    size: item.size || 'M' // Save size
                });
            } else {
                console.warn(`Product not found for checkout: ${item.productId}`);
            }
        }

        if (orderItemsData.length === 0) {
            alert('Votre panier semble contenir des produits invalides ou indisponibles.');
            return false;
        }

        // 4. Create Order Data
        // Ensure customerInfo is clean
        const orderData = {
            user_id: userId, // NULL for guest
            total_amount: totalAmount,
            status: 'pending',
            shipping_address: customerInfo, // JSONB handles object directly
            created_at: new Date().toISOString()
        };

        // 5. Insert Order
        const { data: order, error: orderError } = await client
            .from('orders')
            .insert([orderData])
            .select() // Important to return the object for ID
            .single();

        if (orderError) {
            console.error('Supabase Insert Error:', orderError);
            // Hint for RLS issues
            if (orderError.code === '42501') {
                alert('Erreur de permissions (RLS) lors de la commande. Veuillez vérifier votre connexion.');
            } else {
                alert('Erreur lors de la création de la commande. Veuillez réessayer.');
            }
            throw orderError;
        }

        // 6. Insert Order Items
        const orderItemsWithId = orderItemsData.map(item => ({
            ...item,
            order_id: order.id
        }));

        const { error: itemsError } = await client
            .from('order_items')
            .insert(orderItemsWithId);

        if (itemsError) {
            console.error('Error inserting items:', itemsError);
            // We managed to create order but not items - serious issue.
            // Ideally we'd rollback (delete order), but for now just warn.
            throw itemsError;
        }

        // 7. Update Stock
        for (const item of orderItemsWithId) {
            const { data: currentProd } = await client
                .from('products')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single();

            if (currentProd) {
                const newStock = Math.max(0, currentProd.stock_quantity - item.quantity);
                await client
                    .from('products')
                    .update({ stock_quantity: newStock })
                    .eq('id', item.product_id);
            }
        }

        return true;

    } catch (error) {
        console.error('Order creation fatal error:', error);
        return false;
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
    initAnalytics();
}

// Expose functions globally
window.oslanAnalytics = {
    createOrder
};
