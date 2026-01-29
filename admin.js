// ===== OSLAN Admin Dashboard =====
// Admin panel with analytics, products management, and orders management

// ===== CONFIGURATION =====
const ADMIN_CONFIG = {
    defaultPeriod: 7, // days
    chartColors: {
        primary: '#111111',
        secondary: '#666666',
        success: '#059669', // Emerald 600
        danger: '#b91c1c'
    }
};

// ===== STATE =====
let currentPeriod = ADMIN_CONFIG.defaultPeriod;
let currentEditingProduct = null;
let salesChart = null;
let trafficChart = null;

// ===== AUTHENTICATION & ACCESS CONTROL =====
async function checkAdminAccess() {
    // Vérifier la session admin dans localStorage
    const adminSession = localStorage.getItem('oslan_admin_session');

    if (!adminSession) {
        console.log('No admin session found');
        redirectToLogin();
        return false;
    }

    try {
        const session = JSON.parse(adminSession);

        if (!session.isAdmin) {
            console.log('Not an admin session');
            redirectToLogin();
            return false;
        }

        // Vérifier que la session n'est pas trop ancienne (24h)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

        if (hoursSinceLogin > 24) {
            console.log('Session expired');
            localStorage.removeItem('oslan_admin_session');
            redirectToLogin();
            return false;
        }

        // Update UI with admin info
        document.getElementById('adminUserName').textContent = session.username || 'Admin';

        return true;
    } catch (error) {
        console.error('Error checking admin access:', error);
        localStorage.removeItem('oslan_admin_session');
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    window.location.href = 'admin-login.html';
}

// ===== NAVIGATION =====
function initNavigation() {
    const navButtons = document.querySelectorAll('.admin-nav-btn');
    const sections = document.querySelectorAll('.admin-section');
    const sectionTitle = document.getElementById('adminSectionTitle');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;

            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active section
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`${sectionId}-section`).classList.add('active');

            // Update title
            const titles = {
                'analytics': 'Analytics',
                'products': 'Gestion des Produits',
                'orders': 'Gestion des Commandes'
            };
            sectionTitle.textContent = titles[sectionId] || sectionId;

            // Load section data
            if (sectionId === 'analytics') loadAnalytics();
            if (sectionId === 'products') loadProducts();
            if (sectionId === 'orders') loadOrders();
        });
    });
}

// ===== ANALYTICS =====
async function loadAnalytics() {
    await Promise.all([
        loadKPIs(),
        loadCharts()
    ]);
}

async function loadKPIs() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);

        // Get sales data
        const { data: orders, error: ordersError } = await client
            .from('orders')
            .select('total_amount, created_at')
            .gte('created_at', startDate.toISOString())
            .neq('status', 'cancelled');

        if (!ordersError && orders) {
            const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
            document.getElementById('kpiRevenue').textContent = `${totalRevenue.toFixed(2)} €`;
            document.getElementById('kpiOrders').textContent = orders.length;
        }

        // Get visitors data
        const { data: analytics, error: analyticsError } = await client
            .from('analytics')
            .select('visitor_id')
            .eq('event_type', 'page_view')
            .gte('created_at', startDate.toISOString());

        if (!analyticsError && analytics) {
            const uniqueVisitors = new Set(analytics.map(a => a.visitor_id)).size;
            document.getElementById('kpiVisitors').textContent = uniqueVisitors;
        }

        // Live visitors (Realtime Presence)
        const channel = client.channel('room_visitors');
        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const liveCount = Object.keys(newState).length;
                document.getElementById('kpiLive').textContent = liveCount;
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Admin also joins but we might want to filter admins out in future
                    // For now, it shows total connected clients including admin
                }
            });

    } catch (error) {
        console.error('Error loading KPIs:', error);
    }
}

async function loadCharts() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);

        // Get sales by day
        const { data: salesData, error: salesError } = await client
            .rpc('get_sales_by_period', {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            });

        if (!salesError && salesData) {
            renderSalesChart(salesData);
        }

        // Get visitors by day
        const { data: visitorsData, error: visitorsError } = await client
            .rpc('get_visitors_by_period', {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            });

        if (!visitorsError && visitorsData) {
            renderTrafficChart(visitorsData);
        }

    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

function renderSalesChart(data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // Destroy existing chart
    if (salesChart) salesChart.destroy();

    const labels = data.map(d => new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })).reverse();
    const values = data.map(d => parseFloat(d.total_sales || 0)).reverse();

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventes (€)',
                data: values,
                borderColor: ADMIN_CONFIG.chartColors.primary,
                backgroundColor: `${ADMIN_CONFIG.chartColors.primary}20`,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value + ' €';
                        }
                    }
                }
            }
        }
    });
}

function renderTrafficChart(data) {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return;

    // Destroy existing chart
    if (trafficChart) trafficChart.destroy();

    const labels = data.map(d => new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })).reverse();
    const values = data.map(d => parseInt(d.unique_visitors || 0)).reverse();

    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Visiteurs',
                data: values,
                borderColor: ADMIN_CONFIG.chartColors.success,
                backgroundColor: `${ADMIN_CONFIG.chartColors.success}20`,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Period filter
function initPeriodFilter() {
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentPeriod = parseInt(btn.dataset.period);
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadAnalytics();
        });
    });
}

// ===== PRODUCTS MANAGEMENT =====
async function loadProducts() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data: products, error } = await client
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderProductsTable(products || []);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    Aucun produit. Cliquez sur "Ajouter un produit" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                <img src="${product.image_url || 'assets/logo.png'}" alt="${product.title}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
            </td>
            <td><strong>${product.title}</strong></td>
            <td>${product.price.toFixed(2)} €</td>
            <td>
                <span class="stock-badge ${product.stock_quantity < 5 ? 'low' : ''}">
                    ${product.stock_quantity}
                </span>
            </td>
            <td>
                <span class="status-badge ${product.is_active ? 'active' : 'inactive'}">
                    ${product.is_active ? 'Actif' : 'Inactif'}
                </span>
                ${product.is_preorder ? '<span class="status-badge warning" style="margin-left:4px">Pré-commande</span>' : ''}
            </td>
            <td>
                <div class="admin-table-actions">
                    <button class="admin-btn-icon" onclick="editProduct('${product.id}')" title="Éditer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="admin-btn-icon danger" onclick="deleteProduct('${product.id}')" title="Supprimer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Product Modal
function initProductModal() {
    const modal = document.getElementById('productModal');
    const addBtn = document.getElementById('addProductBtn');
    const closeBtn = document.getElementById('closeProductModal');
    const cancelBtn = document.getElementById('cancelProductBtn');
    const form = document.getElementById('productForm');

    addBtn.addEventListener('click', () => {
        currentEditingProduct = null;
        document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
        form.reset();
        // Add pre-order checkbox dynamically if missing
        ensurePreorderField();
        modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProduct();
    });
}

function ensurePreorderField() {
    // Check if preorder field exists in form, if not add it
    let container = document.getElementById('preorderContainer');
    if (!container) {
        const form = document.getElementById('productForm');
        // Insert before submit buttons
        const btnGroup = form.querySelector('.form-actions');

        container = document.createElement('div');
        container.id = 'preorderContainer';
        container.className = 'form-group checkbox-group';
        container.style.marginBottom = '20px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';

        container.innerHTML = `
            <input type="checkbox" id="productPreorder" name="is_preorder" style="width:auto; margin:0;">
            <label for="productPreorder" style="margin:0; font-weight:500;">Activer la Pré-commande</label>
        `;

        form.insertBefore(container, btnGroup);
    }
}

async function editProduct(productId) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data: product, error } = await client
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;

        currentEditingProduct = product;
        document.getElementById('productModalTitle').textContent = 'Modifier le produit';
        document.getElementById('productTitle').value = product.title;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock_quantity;
        document.getElementById('productImage').value = product.image_url || '';
        document.getElementById('productCategory').value = product.category || '';

        ensurePreorderField();
        const preorderCheckbox = document.getElementById('productPreorder');
        if (preorderCheckbox) {
            preorderCheckbox.checked = !!product.is_preorder;
        }

        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Erreur lors du chargement du produit');
    }
}

async function saveProduct() {
    const client = getSupabaseClient();
    if (!client) return;

    const productData = {
        title: document.getElementById('productTitle').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock_quantity: parseInt(document.getElementById('productStock').value),
        image_url: document.getElementById('productImage').value,
        category: document.getElementById('productCategory').value,
        // Safe check for preorder field
        is_preorder: document.getElementById('productPreorder') ? document.getElementById('productPreorder').checked : false
    };

    try {
        if (currentEditingProduct) {
            // Update existing product
            const { error } = await client
                .from('products')
                .update(productData)
                .eq('id', currentEditingProduct.id);

            if (error) throw error;
        } else {
            // Create new product
            const { error } = await client
                .from('products')
                .insert([productData]);

            if (error) throw error;
        }

        document.getElementById('productModal').classList.remove('active');
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Erreur lors de l\'enregistrement du produit. Vérifiez que la colonne is_preorder existe.');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { error } = await client
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;

        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erreur lors de la suppression du produit');
    }
}

// ===== ORDERS MANAGEMENT =====
async function loadOrders() {
    const client = getSupabaseClient();
    if (!client) return;

    const statusFilter = document.getElementById('orderStatusFilter').value;

    try {
        let query = client
            .from('orders')
            .select(`
                *,
                profiles:user_id (email, first_name, last_name)
            `)
            .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data: orders, error } = await query;

        if (error) throw error;

        renderOrdersTable(orders || []);

        // Realtime Orders Update
        const channel = client.channel('orders_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                // If new insert or update, reload list
                loadOrders();
                // Also update revenue
                loadKPIs();
            })
            .subscribe();

    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    Aucune commande trouvée.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        // Use detailed customer info if available in shipping_address (JSONB)
        const shipping = order.shipping_address || {};
        const customerName = shipping.firstName && shipping.lastName
            ? `${shipping.firstName} ${shipping.lastName}`
            : (order.profiles
                ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || order.profiles.email
                : 'Client inconnu');

        return `
            <tr>
                <td><code>${order.id.substring(0, 8)}</code></td>
                <td>
                    <div style="font-weight:600">${customerName}</div>
                    <div style="font-size:11px; color:#666">${shipping.city || ''}</div>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                    <select class="status-select status-${order.status}" 
                            onchange="updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>En attente</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>En cours</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Expédiée</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Livrée</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
                    </select>
                </td>
                <td><strong>${parseFloat(order.total_amount).toFixed(2)} €</strong></td>
                <td>
                    <button class="admin-btn-icon" onclick="viewOrderDetails('${order.id}')" title="Voir détails">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { error } = await client
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) throw error;

        // No need to reload manually if realtime is working, but safety first
        // loadOrders(); 
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Erreur lors de la mise à jour du statut');
    }
}

async function viewOrderDetails(orderId) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data: order, error: orderError } = await client
            .from('orders')
            .select(`
                *,
                profiles:user_id (email, first_name, last_name)
            `)
            .eq('id', orderId)
            .single();

        if (orderError) throw orderError;

        const { data: items, error: itemsError } = await client
            .from('order_items')
            .select(`
                *,
                products (title, image_url)
            `)
            .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        renderOrderDetails(order, items || []);
        document.getElementById('orderModal').classList.add('active');
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Erreur lors du chargement des détails: ' + error.message);
    }
}

function renderOrderDetails(order, items) {
    const content = document.getElementById('orderDetailsContent');
    if (!content) return;

    const shipping = order.shipping_address || {};

    // Parse address if it's stored as JSON string (legacy)
    let shipAddr = shipping;
    if (typeof shipping === 'string') {
        try { shipAddr = JSON.parse(shipping); } catch (e) { }
    }

    const customerName = shipAddr.firstName
        ? `${shipAddr.firstName} ${shipAddr.lastName}`
        : (order.profiles
            ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`
            : 'Client inconnu');

    const fullAddress = shipAddr.address
        ? `${shipAddr.address}<br>${shipAddr.zip} ${shipAddr.city}<br>${shipAddr.country}`
        : 'Adresse non renseignée';

    const contactInfo = `
        <div><strong>Email:</strong> ${shipAddr.email || order.profiles?.email || 'N/A'}</div>
        <div><strong>Tél:</strong> ${shipAddr.phone || order.profiles?.phone || 'N/A'}</div>
    `;

    content.innerHTML = `
        <div class="order-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div class="order-detail-card" style="background:var(--color-bg); padding:15px; border-radius:12px; border:1px solid #eee;">
                <h4 style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">Client & Contact</h4>
                <div style="font-size:14px;">
                    <p style="font-size:16px; font-weight:600; margin-bottom:5px;">${customerName}</p>
                    ${contactInfo}
                </div>
            </div>

            <div class="order-detail-card" style="background:var(--color-bg); padding:15px; border-radius:12px; border:1px solid #eee;">
                <h4 style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">Livraison</h4>
                <div style="font-size:14px; line-height:1.5;">
                    ${fullAddress}
                </div>
                <div style="margin-top:10px; font-size:12px; color:#666;">
                    Mode de paiement: <strong>${shipAddr.paymentMethod === 'paypal' ? 'PayPal' : 'Carte Bancaire'}</strong>
                </div>
            </div>
        </div>

        <div class="order-products-section">
            <h4 style="margin-bottom:15px;">Produits commandés (${items.length})</h4>
            <div class="order-items-list">
                ${items.map(item => `
                    <div class="order-item-detail" 
                         style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #f0f0f0;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${item.products?.image_url || 'assets/logo.png'}" 
                                 alt="${item.products?.title || 'Produit'}"
                                 style="width:50px; height:50px; object-fit:cover; border-radius:6px; background:#f5f5f5;">
                            <div>
                                <p style="font-weight:600; margin-bottom:2px;">${item.products?.title || 'Produit inconnu'}</p>
                                <p style="font-size:12px; color:#666;">Qté: ${item.quantity} × ${parseFloat(item.price_at_purchase).toFixed(2)} €</p>
                            </div>
                        </div>
                        <div style="font-weight:600;">
                            ${(item.quantity * parseFloat(item.price_at_purchase)).toFixed(2)} €
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="order-total-section" style="margin-top:20px; text-align:right; font-size:18px;">
            <span>Total Commande: </span>
            <span style="font-weight:700;">${parseFloat(order.total_amount).toFixed(2)} €</span>
        </div>
    `;
}

// Order modal close
function initOrderModal() {
    const closeBtn = document.getElementById('closeOrderModal');
    const modal = document.getElementById('orderModal');
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
}

// Order status filter
function initOrderFilter() {
    const filter = document.getElementById('orderStatusFilter');
    filter.addEventListener('change', loadOrders);
}

function initLogout() {
    const logoutBtn = document.getElementById('adminLogoutBtn');
    logoutBtn.addEventListener('click', async () => {
        // Clear admin session
        localStorage.removeItem('oslan_admin_session');
        localStorage.removeItem('oslan_token');
        window.location.href = 'admin-login.html';
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check admin access first
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return;

    // Initialize all components
    initNavigation();
    initPeriodFilter();
    initProductModal();
    initOrderModal();
    initOrderFilter();
    initLogout();

    // Load initial data
    await loadAnalytics();

    console.log('✅ Admin Dashboard loaded successfully');
});

// Make functions globally accessible for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
