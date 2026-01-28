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
        // 1. Calculate Total
        let totalAmount = 0;

        // Fetch products to get real prices and IDs
        const { data: products } = await client.from('products').select('id, title, price, image_url');

        // Let's check auth
        const { data: { user } } = await client.auth.getUser();
        let userId = user ? user.id : null;

        // If no user tracking for guests implemented yet, we create a guest profile/order if the schema allows nullable user_id

        // Calculate total amount
        const orderItemsData = [];

        for (const item of cartItems) {
            // Find product ID in DB (basic matching for migration)
            // We look for a product that contains the same key words or similar image path
            let dbProduct = null;
            if (products) {
                // Try to match by ID if item.productId matches a UUID (unlikely yet) or fallback to fuzzy match
                dbProduct = products.find(p => p.id === item.productId);

                if (!dbProduct) {
                    // Fuzzy match: check if product title contains part of the ID string
                    // e.g. 'tshirt-blanc' -> match product having 'tshirt' and 'blanc' in title/image?
                    // Simplified: map existing known IDs to DB logic if possible, or just rely on title match
                    const searchKey = item.productId.replace(/-/g, ' '); // 'tshirt blanc'
                    dbProduct = products.find(p => p.title.toLowerCase().includes('blanc') && item.productId.includes('blanc'));
                    if (!dbProduct && item.productId.includes('noir')) {
                        dbProduct = products.find(p => p.title.toLowerCase().includes('noir'));
                    }
                    // Very basic fallback
                    if (!dbProduct) dbProduct = products[0];
                }
            }

            if (dbProduct) {
                totalAmount += dbProduct.price * item.quantity;
                orderItemsData.push({
                    product_id: dbProduct.id,
                    quantity: item.quantity,
                    price_at_purchase: dbProduct.price
                });
            }
        }

        const orderData = {
            user_id: userId, // Can be null if schema allows, otherwise restricted
            total_amount: totalAmount,
            status: 'pending',
            shipping_address: customerInfo
        };

        // Insert Order
        const { data: order, error: orderError } = await client
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) throw orderError;

        // Insert Order Items
        const orderItems = orderItemsData.map(item => ({
            ...item,
            order_id: order.id
        }));

        if (orderItems.length > 0) {
            const { error: itemsError } = await client
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;
        }

        return true;

    } catch (error) {
        console.error('Order creation error:', error);
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
