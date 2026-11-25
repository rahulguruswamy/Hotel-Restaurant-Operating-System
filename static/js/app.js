let menuItems = [];
let cart = [];
let selectedPayMethod = 'cash';
let tablesList = [];
let roomsList = [];
let guestsList = [];
let bookingsList = [];
let reservationsList = [];
let kdsTickets = [];
let inventoryList = [];
let availableRoomsForBooking = [];
let salesChartInstance = null;
let topItemsChartInstance = null;

// --- API HELPER ---
async function apiFetch(url, options = {}) {
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    };
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('sidebarNav').classList.toggle('hidden');
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });

    await loadAllData();
});

async function loadAllData() {
    try {
        await Promise.all([
            loadCurrentUser(),
            loadDashboard(false),
            loadProducts(),
            loadTables(),
            loadRooms(),
            loadGuests(),
            loadBookings(),
            loadReservations(),
            loadKDS(),
            loadInventory(),
        ]);
        populateOrderTargets();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-brand-50', 'text-brand-600', 'dark:bg-brand-900/30', 'dark:text-brand-400');
        btn.classList.add('text-slate-600', 'dark:text-slate-300');
    });

    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) activeView.classList.remove('hidden');

    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.classList.add('bg-brand-50', 'text-brand-600', 'dark:bg-brand-900/30', 'dark:text-brand-400');
    }

    const titles = {
        'dashboard': 'Dashboard Overview',
        'pos': 'POS & Order Billing',
        'tables-rooms': 'Tables, Rooms, Bookings & Guests',
        'kds': 'Kitchen Display System (KDS)',
        'inventory': 'Stock & Inventory Management',
        'analytics': 'Business Analytics & Reports'
    };
    document.getElementById('pageTitle').innerText = titles[tabId] || 'Overview';

    if (tabId === 'dashboard') loadDashboard(false);
    if (tabId === 'kds') loadKDS();
    if (tabId === 'analytics') loadAnalytics();
}

// --- AUTH ---
async function loadCurrentUser() {
    const data = await apiFetch('/api/auth/me');
    if (data.user) {
        document.getElementById('staffName').innerText = data.user.full_name;
        document.getElementById('staffRole').innerText = data.user.role;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        document.getElementById('staffName').innerText = data.user.full_name;
        document.getElementById('staffRole').innerText = data.user.role;
        closeModal('loginModal');
        showToast(data.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- DASHBOARD ---
async function loadDashboard(notify = false) {
    const data = await apiFetch('/api/dashboard');
    document.getElementById('dashRevenue').innerText = `$${data.total_revenue.toFixed(2)}`;
    document.getElementById('dashRevenueSub').innerText = `Today: $${data.today_revenue.toFixed(2)} • ${data.total_bookings} Total Bookings`;
    document.getElementById('dashOccupancy').innerText = `${data.occupancy_pct}%`;
    document.getElementById('dashOccupancySub').innerText = `${data.occupied_rooms} of ${data.total_rooms} Occupied • ${data.available_rooms} Available`;
    document.getElementById('dashTables').innerText = `${data.active_tables} / ${data.total_tables}`;
    document.getElementById('dashTablesSub').innerText = `${data.total_bookings} Active/Past Bookings`;
    document.getElementById('dashPendingOrders').innerText = `${data.pending_orders} Pending`;

    document.getElementById('kdsBadge').innerText = data.pending_orders;
    document.getElementById('lowStockBadge').innerText = data.low_stock_count;

    const feedEl = document.getElementById('activityFeed');
    if (data.activity_feed.length === 0) {
        feedEl.innerHTML = `<p class="text-xs text-slate-400">No recent database activity yet.</p>`;
    } else {
        feedEl.innerHTML = data.activity_feed.map(log => `
            <div class="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                <div class="p-2 rounded-lg ${escapeHtml(log.color)} shrink-0">
                    <i class="fa-solid ${escapeHtml(log.icon)} text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-800 dark:text-white">${escapeHtml(log.title)}</p>
                    <p class="text-xs text-slate-500 truncate">${escapeHtml(log.desc)}</p>
                </div>
                <span class="text-[10px] text-slate-400 whitespace-nowrap">${escapeHtml(log.time)}</span>
            </div>
        `).join('');
    }
    if (notify) showToast('Dashboard synced with SQLite');
}

// --- POS & BILLING ---
async function loadProducts() {
    menuItems = await apiFetch('/api/products');
    renderMenuGrid('all');
}

function renderMenuGrid(cat) {
    const grid = document.getElementById('menuGrid');
    const items = cat === 'all' ? menuItems : menuItems.filter(i => i.category === cat);

    grid.innerHTML = items.map(item => `
        <div onclick="addToCart(${item.id})" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-500 transition cursor-pointer group flex flex-col justify-between">
            <div class="h-28 overflow-hidden relative">
                <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <span class="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 text-xs font-bold px-2 py-1 rounded-lg backdrop-blur">$${Number(item.price).toFixed(2)}</span>
            </div>
            <div class="p-3">
                <h4 class="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">${escapeHtml(item.name)}</h4>
                <p class="text-xs text-slate-500 capitalize">${escapeHtml(item.category)}</p>
            </div>
        </div>
    `).join('');
}

function filterMenu(cat, btnEl) {
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-brand-600', 'text-white');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    });
    if (btnEl) {
        btnEl.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
        btnEl.classList.add('active', 'bg-brand-600', 'text-white');
    }
    renderMenuGrid(cat);
}

function populateOrderTargets() {
    const options = [
        ...tablesList.map(t => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)} (${escapeHtml(t.status)})</option>`),
        ...roomsList.filter(r => r.status === 'occupied').map(r => `<option value="Room ${escapeHtml(r.room_number)}">Room ${escapeHtml(r.room_number)}</option>`),
        `<option value="Takeaway">Takeaway</option>`
    ].join('');
    document.getElementById('orderTarget').innerHTML = options;
    document.getElementById('quickOrderTarget').innerHTML = options;
}

function startQuickOrder() {
    const chosen = document.getElementById('quickOrderTarget').value;
    document.getElementById('orderTarget').value = chosen;
    closeModal('newOrderModal');
    switchTab('pos');
}

function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    const existing = cart.find(i => i.id === itemId);
    if (existing) existing.qty++;
    else cart.push({ ...item, qty: 1 });
    updateCartUI();
    showToast(`Added ${item.name} to cart`);
}

function updateCartQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cartItemsList');
    if (cart.length === 0) {
        list.innerHTML = `
            <div class="text-center py-10 text-slate-400 text-sm">
                <i class="fa-solid fa-basket-shopping text-3xl mb-2 opacity-50"></i>
                <p>No items added to order yet.</p>
            </div>`;
    } else {
        list.innerHTML = cart.map(item => `
            <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-xl">
                <div class="flex-1 pr-2">
                    <h5 class="text-xs font-bold text-slate-800 dark:text-white leading-tight">${escapeHtml(item.name)}</h5>
                    <span class="text-xs text-brand-600 dark:text-brand-400 font-semibold">$${(item.price * item.qty).toFixed(2)}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="updateCartQty(${item.id}, -1)" class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-600 text-xs font-bold hover:bg-slate-300 flex items-center justify-center">-</button>
                    <span class="text-xs font-bold w-4 text-center">${item.qty}</span>
                    <button onclick="updateCartQty(${item.id}, 1)" class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-600 text-xs font-bold hover:bg-slate-300 flex items-center justify-center">+</button>
                </div>
            </div>
        `).join('');
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxService = subtotal * 0.18;
    const applyDiscount = document.getElementById('discountToggle').checked;
    const discount = applyDiscount ? subtotal * 0.10 : 0;
    const total = Math.max(0, subtotal + taxService - discount);

    document.getElementById('cartSubtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('cartTax').innerText = `$${taxService.toFixed(2)}`;
    document.getElementById('cartDiscount').innerText = `-$${discount.toFixed(2)}`;
    document.getElementById('cartTotal').innerText = `$${total.toFixed(2)}`;
}

function processCheckout() {
    if (cart.length === 0) {
        showToast('Cart is empty!', 'error');
        return;
    }
    document.getElementById('checkoutAmount').innerText = document.getElementById('cartTotal').innerText;
    openModal('checkoutModal');
}

function selectPayMethod(method) {
    selectedPayMethod = method;
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
        btn.classList.remove('active', 'border-brand-500', 'text-brand-600', 'bg-brand-50/50');
        btn.classList.add('border-slate-200', 'text-slate-600');
    });
    const activeBtn = document.getElementById(`payBtn-${method}`);
    activeBtn.classList.add('active', 'border-brand-500', 'text-brand-600', 'bg-brand-50/50');
}

async function confirmPayment() {
    try {
        const target = document.getElementById('orderTarget').value;
        const applyDiscount = document.getElementById('discountToggle').checked;
        const payload = {
            target,
            apply_discount: applyDiscount,
            payment_method: selectedPayMethod,
            items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
        };
        const res = await apiFetch('/api/orders/checkout', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        cart = [];
        document.getElementById('discountToggle').checked = false;
        updateCartUI();
        closeModal('checkoutModal');
        showReceiptModal(res.receipt);
        await Promise.all([loadDashboard(false), loadTables(), loadKDS(), loadInventory()]);
        populateOrderTargets();
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function showReceiptModal(r) {
    const linesHtml = r.items.map(it => `
        <div class="flex justify-between">
            <span>${it.quantity}x ${escapeHtml(it.name)}</span>
            <span>$${Number(it.line_total).toFixed(2)}</span>
        </div>
    `).join('');
    document.getElementById('receiptContent').innerHTML = `
        <div class="flex justify-between text-slate-500"><span>Order:</span><strong>${escapeHtml(r.order_code)}</strong></div>
        <div class="flex justify-between text-slate-500"><span>Txn Ref:</span><strong>${escapeHtml(r.transaction_ref)}</strong></div>
        <div class="flex justify-between text-slate-500"><span>Target:</span><span>${escapeHtml(r.target)}</span></div>
        <div class="flex justify-between text-slate-500"><span>Method:</span><span>${escapeHtml(r.payment_method)} (Demo)</span></div>
        <div class="flex justify-between text-slate-500"><span>Date:</span><span>${escapeHtml(r.created_at)}</span></div>
        <hr class="border-slate-200 dark:border-slate-700 my-2">
        <div class="space-y-1">${linesHtml}</div>
        <hr class="border-slate-200 dark:border-slate-700 my-2">
        <div class="flex justify-between"><span>Subtotal</span><span>$${Number(r.subtotal).toFixed(2)}</span></div>
        <div class="flex justify-between"><span>Tax &amp; Service (18%)</span><span>$${Number(r.tax_amount).toFixed(2)}</span></div>
        <div class="flex justify-between text-emerald-600"><span>Discount</span><span>-$${Number(r.discount_amount).toFixed(2)}</span></div>
        <div class="flex justify-between text-sm font-bold pt-1"><span>Total Paid</span><span>$${Number(r.total_amount).toFixed(2)}</span></div>
    `;
    openModal('receiptModal');
}

// --- TABLES, ROOMS, BOOKINGS, GUESTS & RESERVATIONS ---
function toggleVisualizerTab(sub) {
    const subtabs = ['tables', 'rooms', 'bookings', 'guests', 'reservations'];
    subtabs.forEach(s => {
        document.getElementById(`subview-${s}`).classList.add('hidden');
        const btn = document.getElementById(`subnav-${s}`);
        btn.classList.remove('text-brand-600', 'border-brand-600');
        btn.classList.add('text-slate-500', 'border-transparent');
    });
    document.getElementById(`subview-${sub}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`subnav-${sub}`);
    activeBtn.classList.add('text-brand-600', 'border-brand-600');
    activeBtn.classList.remove('text-slate-500', 'border-transparent');
}

async function loadTables() {
    tablesList = await apiFetch('/api/tables');
    const tGrid = document.getElementById('visualizerTables');
    const statusColors = {
        available: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
        occupied: 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400',
        reserved: 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
        cleaning: 'border-slate-400 bg-slate-100/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
    };
    tGrid.innerHTML = tablesList.map(t => `
        <div onclick="cycleTableStatus(${t.id}, '${t.status}')" class="p-4 rounded-2xl border-2 ${statusColors[t.status] || statusColors.available} transition cursor-pointer flex flex-col justify-between h-36 hover:scale-[1.02]">
            <div class="flex justify-between items-start">
                <span class="font-bold text-base text-slate-800 dark:text-white">${escapeHtml(t.name)}</span>
                <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-white/80 dark:bg-slate-800">${escapeHtml(t.status)}</span>
            </div>
            <div class="text-xs space-y-1">
                <p class="text-slate-500 dark:text-slate-400"><i class="fa-solid fa-user-group mr-1"></i> ${t.capacity} Seats</p>
                ${t.active_order_total > 0 ? `<p class="font-bold text-slate-800 dark:text-slate-200">Active Bill: $${Number(t.active_order_total).toFixed(2)}</p>` : ''}
            </div>
        </div>
    `).join('');
}

async function cycleTableStatus(tableId, currentStatus) {
    const order = ['available', 'occupied', 'reserved', 'cleaning'];
    const nextStatus = order[(order.indexOf(currentStatus) + 1) % order.length];
    try {
        await apiFetch(`/api/tables/${tableId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: nextStatus }),
        });
        await Promise.all([loadTables(), loadDashboard(false)]);
        populateOrderTargets();
        showToast(`Table status updated to ${nextStatus}`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadRooms() {
    roomsList = await apiFetch('/api/rooms');
    const rGrid = document.getElementById('visualizerRooms');
    const statusColors = {
        available: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20',
        occupied: 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20',
        reserved: 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20',
        cleaning: 'border-slate-400 bg-slate-100/50 dark:bg-slate-800',
        maintenance: 'border-slate-500 bg-slate-200/40 dark:bg-slate-800',
    };
    rGrid.innerHTML = roomsList.map(r => `
        <div class="p-4 rounded-2xl border-2 ${statusColors[r.status] || statusColors.available} flex flex-col justify-between min-h-[11rem]">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-base text-slate-800 dark:text-white">Room ${escapeHtml(r.room_number)}</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(r.room_type)} • $${Number(r.price_per_night).toFixed(0)}/night</p>
                </div>
                <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-white/80 dark:bg-slate-800">${escapeHtml(r.status)}</span>
            </div>
            <div class="space-y-2 mt-2">
                <p class="text-xs font-medium text-slate-700 dark:text-slate-300">${r.current_guest ? 'Guest: ' + escapeHtml(r.current_guest) : 'Vacant'}</p>
                <div class="flex flex-wrap gap-1.5">
                    ${r.status === 'occupied' && r.active_booking_id ? `<button onclick="checkoutBooking(${r.active_booking_id})" class="text-xs bg-rose-600 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-rose-700">Check-Out</button>` : ''}
                    ${r.status === 'available' ? `<button onclick="quickCheckInRoom(${r.id})" class="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-emerald-700">Check-In</button>` : ''}
                    ${r.status === 'cleaning' ? `<button onclick="markRoomAvailable(${r.id})" class="text-xs bg-sky-600 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-sky-700">Mark Clean</button>` : ''}
                    <button onclick="openRoomModal(${r.id})" class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-lg font-semibold hover:opacity-80">Edit</button>
                    <button onclick="deleteRoom(${r.id})" class="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg font-semibold hover:opacity-80">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function openRoomModal(roomId = null) {
    const room = roomsList.find(r => r.id === roomId);
    document.getElementById('roomModalTitle').innerText = room ? `Edit Room ${room.room_number}` : 'Add Room';
    document.getElementById('roomEditId').value = room ? room.id : '';
    document.getElementById('roomNumberInput').value = room ? room.room_number : '';
    document.getElementById('roomTypeInput').value = room ? room.room_type : '';
    document.getElementById('roomPriceInput').value = room ? room.price_per_night : '';
    document.getElementById('roomStatusInput').value = room ? room.status : 'available';
    openModal('roomModal');
}

async function handleSaveRoom(e) {
    e.preventDefault();
    const id = document.getElementById('roomEditId').value;
    const payload = {
        room_number: document.getElementById('roomNumberInput').value,
        room_type: document.getElementById('roomTypeInput').value,
        price_per_night: parseFloat(document.getElementById('roomPriceInput').value),
        status: document.getElementById('roomStatusInput').value,
    };
    try {
        if (id) {
            await apiFetch(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Room updated!');
        } else {
            await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify(payload) });
            showToast('New room added!');
        }
        closeModal('roomModal');
        await Promise.all([loadRooms(), loadDashboard(false)]);
        populateOrderTargets();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function markRoomAvailable(roomId) {
    try {
        await apiFetch(`/api/rooms/${roomId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'available' }),
        });
        await Promise.all([loadRooms(), loadDashboard(false)]);
        showToast('Room is now available');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteRoom(roomId) {
    if (!confirm('Delete this room from the database?')) return;
    try {
        const res = await apiFetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
        await Promise.all([loadRooms(), loadDashboard(false)]);
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- GUESTS ---
async function loadGuests(query = '') {
    const url = query ? `/api/guests?q=${encodeURIComponent(query)}` : '/api/guests';
    guestsList = await apiFetch(url);
    const tbody = document.getElementById('guestsTableBody');
    if (guestsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">No guest records found.</td></tr>`;
        return;
    }
    tbody.innerHTML = guestsList.map(g => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
            <td class="p-4 font-semibold">${escapeHtml(g.full_name)}</td>
            <td class="p-4 text-slate-500">${escapeHtml(g.phone || '-')}</td>
            <td class="p-4 text-slate-500">${escapeHtml(g.email || '-')}</td>
            <td class="p-4 text-slate-500">${escapeHtml(g.id_proof || '-')}</td>
            <td class="p-4 text-right">
                <button onclick="openGuestModal(${g.id})" class="text-xs bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 px-3 py-1.5 rounded-lg font-bold">Edit</button>
            </td>
        </tr>
    `).join('');
}

function openGuestModal(guestId = null) {
    const g = guestsList.find(item => item.id === guestId);
    document.getElementById('guestModalTitle').innerText = g ? `Edit Guest: ${g.full_name}` : 'Add Guest';
    document.getElementById('guestEditId').value = g ? g.id : '';
    document.getElementById('guestNameInput').value = g ? g.full_name : '';
    document.getElementById('guestPhoneInput').value = g ? (g.phone || '') : '';
    document.getElementById('guestEmailInput').value = g ? (g.email || '') : '';
    document.getElementById('guestIdProofInput').value = g ? (g.id_proof || '') : '';
    document.getElementById('guestAddressInput').value = g ? (g.address || '') : '';
    openModal('guestModal');
}

async function handleSaveGuest(e) {
    e.preventDefault();
    const id = document.getElementById('guestEditId').value;
    const payload = {
        full_name: document.getElementById('guestNameInput').value,
        phone: document.getElementById('guestPhoneInput').value,
        email: document.getElementById('guestEmailInput').value,
        id_proof: document.getElementById('guestIdProofInput').value,
        address: document.getElementById('guestAddressInput').value,
    };
    try {
        if (id) {
            await apiFetch(`/api/guests/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Guest record updated!');
        } else {
            await apiFetch('/api/guests', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Guest added!');
        }
        closeModal('guestModal');
        await loadGuests(document.getElementById('guestSearchInput').value);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- BOOKINGS & QUICK CHECK-IN ---
async function loadBookings() {
    bookingsList = await apiFetch('/api/bookings');
    const tbody = document.getElementById('bookingsTableBody');
    if (bookingsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">No bookings recorded yet.</td></tr>`;
        return;
    }
    const badgeStyles = {
        confirmed: 'bg-amber-100 text-amber-800',
        checked_in: 'bg-emerald-100 text-emerald-800',
        checked_out: 'bg-slate-200 text-slate-700',
        cancelled: 'bg-rose-100 text-rose-700',
    };
    tbody.innerHTML = bookingsList.map(b => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
            <td class="p-4 font-bold">${escapeHtml(b.booking_ref)}</td>
            <td class="p-4">${escapeHtml(b.guest_name)}</td>
            <td class="p-4">Room ${escapeHtml(b.room_number)}</td>
            <td class="p-4 text-xs">${escapeHtml(b.check_in_date)} → ${escapeHtml(b.check_out_date)} (${b.nights}n)</td>
            <td class="p-4 font-bold">$${Number(b.total_amount).toFixed(2)}</td>
            <td class="p-4"><span class="text-xs px-2.5 py-1 rounded-full font-bold uppercase ${badgeStyles[b.status] || ''}">${escapeHtml(b.status.replace('_', ' '))}</span></td>
            <td class="p-4 text-right space-x-1">
                ${b.status === 'confirmed' ? `<button onclick="checkinBooking(${b.id})" class="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold">Check-In</button>` : ''}
                ${b.status === 'checked_in' ? `<button onclick="checkoutBooking(${b.id})" class="text-xs bg-brand-600 text-white px-2.5 py-1 rounded-lg font-bold">Check-Out</button>` : ''}
                ${(b.status === 'confirmed' || b.status === 'checked_in') ? `<button onclick="cancelBooking(${b.id})" class="text-xs bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-bold">Cancel</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function quickCheckInRoom(roomId) {
    openModal('checkInModal');
    document.getElementById('checkInRoomSelect').value = String(roomId);
}

async function handleCheckIn(e) {
    e.preventDefault();
    try {
        const payload = {
            guest_name: document.getElementById('checkInName').value,
            guest_phone: document.getElementById('checkInPhone').value,
            room_id: parseInt(document.getElementById('checkInRoomSelect').value, 10),
            nights: parseInt(document.getElementById('checkInNights').value, 10),
            check_in_now: true,
        };
        const created = await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
        closeModal('checkInModal');
        document.getElementById('checkInName').value = '';
        document.getElementById('checkInPhone').value = '';
        await Promise.all([loadRooms(), loadBookings(), loadGuests(), loadDashboard(false)]);
        populateOrderTargets();
        showToast(`Checked in ${created.guest_name} to Room ${created.room_number}!`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function openBookingModal() {
    await loadGuests();
    document.getElementById('bookingGuestSelect').innerHTML = guestsList.map(
        g => `<option value="${g.id}">${escapeHtml(g.full_name)} (${escapeHtml(g.phone || 'No phone')})</option>`
    ).join('');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    document.getElementById('bookingCheckInDate').value = today.toISOString().slice(0, 10);
    document.getElementById('bookingCheckOutDate').value = tomorrow.toISOString().slice(0, 10);
    openModal('bookingModal');
    await refreshBookingAvailableRooms();
}

async function refreshBookingAvailableRooms() {
    const checkIn = document.getElementById('bookingCheckInDate').value;
    const checkOut = document.getElementById('bookingCheckOutDate').value;
    const select = document.getElementById('bookingRoomSelect');
    try {
        availableRoomsForBooking = await apiFetch(`/api/rooms/available?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(checkOut)}`);
        if (availableRoomsForBooking.length === 0) {
            select.innerHTML = `<option value="">No rooms available for selected dates</option>`;
        } else {
            select.innerHTML = availableRoomsForBooking.map(
                r => `<option value="${r.id}">Room ${escapeHtml(r.room_number)} - ${escapeHtml(r.room_type)} ($${Number(r.price_per_night).toFixed(2)}/night)</option>`
            ).join('');
        }
        updateBookingEstimate();
    } catch (err) {
        select.innerHTML = `<option value="">${escapeHtml(err.message)}</option>`;
        document.getElementById('bookingEstimateBox').innerText = err.message;
    }
}

function updateBookingEstimate() {
    const checkIn = new Date(document.getElementById('bookingCheckInDate').value);
    const checkOut = new Date(document.getElementById('bookingCheckOutDate').value);
    const roomId = parseInt(document.getElementById('bookingRoomSelect').value, 10);
    const room = availableRoomsForBooking.find(r => r.id === roomId);
    const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (room && nights >= 1) {
        const total = (nights * Number(room.price_per_night)).toFixed(2);
        document.getElementById('bookingEstimateBox').innerText = `${nights} night(s) × $${Number(room.price_per_night).toFixed(2)} = Total $${total}`;
    } else {
        document.getElementById('bookingEstimateBox').innerText = 'Select valid dates and room to calculate total.';
    }
}

async function handleCreateBooking(e) {
    e.preventDefault();
    try {
        const payload = {
            guest_id: parseInt(document.getElementById('bookingGuestSelect').value, 10),
            room_id: parseInt(document.getElementById('bookingRoomSelect').value, 10),
            check_in_date: document.getElementById('bookingCheckInDate').value,
            check_out_date: document.getElementById('bookingCheckOutDate').value,
            check_in_now: document.getElementById('bookingCheckInNow').checked,
        };
        const created = await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
        closeModal('bookingModal');
        await Promise.all([loadRooms(), loadBookings(), loadDashboard(false)]);
        populateOrderTargets();
        showToast(`Booking ${created.booking_ref} saved!`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function checkinBooking(bookingId) {
    try {
        const res = await apiFetch(`/api/bookings/${bookingId}/checkin`, { method: 'POST' });
        await Promise.all([loadRooms(), loadBookings(), loadDashboard(false)]);
        populateOrderTargets();
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function checkoutBooking(bookingId) {
    try {
        const res = await apiFetch(`/api/bookings/${bookingId}/checkout`, {
            method: 'POST',
            body: JSON.stringify({ method: 'card' }),
        });
        await Promise.all([loadRooms(), loadBookings(), loadDashboard(false)]);
        populateOrderTargets();
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Cancel this booking?')) return;
    try {
        const res = await apiFetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
        await Promise.all([loadRooms(), loadBookings(), loadDashboard(false)]);
        populateOrderTargets();
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- RESERVATIONS ---
async function loadReservations() {
    reservationsList = await apiFetch('/api/reservations');
    const tbody = document.getElementById('reservationsTableBody');
    if (reservationsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No table reservations yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = reservationsList.map(r => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
            <td class="p-4 font-semibold">${escapeHtml(r.table_name)}</td>
            <td class="p-4">${escapeHtml(r.guest_name)} <span class="text-xs text-slate-400">${escapeHtml(r.guest_phone || '')}</span></td>
            <td class="p-4">${r.party_size} guests</td>
            <td class="p-4 text-xs">${escapeHtml(r.reservation_time.replace('T', ' '))}</td>
            <td class="p-4 uppercase text-xs font-bold">${escapeHtml(r.status)}</td>
            <td class="p-4 text-right space-x-1">
                ${r.status === 'confirmed' ? `<button onclick="setReservationStatus(${r.id}, 'seated')" class="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold">Seat</button>` : ''}
                ${(r.status === 'confirmed' || r.status === 'seated') ? `<button onclick="setReservationStatus(${r.id}, 'completed')" class="text-xs bg-brand-600 text-white px-2.5 py-1 rounded-lg font-bold">Complete</button>` : ''}
                ${r.status === 'confirmed' ? `<button onclick="setReservationStatus(${r.id}, 'cancelled')" class="text-xs bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-bold">Cancel</button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function handleReserveTable(e) {
    e.preventDefault();
    try {
        const payload = {
            guest_name: document.getElementById('reserveName').value,
            guest_phone: document.getElementById('reservePhone').value,
            party_size: parseInt(document.getElementById('reservePartySize').value, 10),
            reservation_time: document.getElementById('reserveDateTime').value,
            table_id: parseInt(document.getElementById('reserveTableSelect').value, 10),
        };
        await apiFetch('/api/reservations', { method: 'POST', body: JSON.stringify(payload) });
        closeModal('reserveTableModal');
        document.getElementById('reserveName').value = '';
        await Promise.all([loadTables(), loadReservations(), loadDashboard(false)]);
        showToast('Table reservation saved!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function setReservationStatus(resId, status) {
    try {
        const res = await apiFetch(`/api/reservations/${resId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
        await Promise.all([loadTables(), loadReservations(), loadDashboard(false)]);
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- KDS ---
async function loadKDS() {
    kdsTickets = await apiFetch('/api/kds');
    const grid = document.getElementById('kdsTicketsGrid');
    document.getElementById('kdsBadge').innerText = kdsTickets.length;

    if (kdsTickets.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">All kitchen orders served!</div>`;
        return;
    }

    grid.innerHTML = kdsTickets.map(ticket => {
        const statusStyles = {
            prep: { border: 'border-amber-500', badge: 'bg-amber-100 text-amber-800', label: 'In Prep' },
            ready: { border: 'border-emerald-500', badge: 'bg-emerald-100 text-emerald-800', label: 'Ready to Serve' }
        };
        const style = statusStyles[ticket.status] || statusStyles.prep;

        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl border-t-4 ${style.border} border-x border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-slate-800 dark:text-white">${escapeHtml(ticket.order_code)}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full font-bold ${style.badge}">${style.label}</span>
                    </div>
                    <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-3"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(ticket.target)}</p>
                    <ul class="text-xs space-y-1.5 border-t border-b border-slate-100 dark:border-slate-700/50 py-2">
                        ${ticket.items.map(i => `<li class="font-medium text-slate-700 dark:text-slate-300">• ${escapeHtml(i)}</li>`).join('')}
                    </ul>
                </div>
                <div class="mt-4 flex justify-between items-center pt-2">
                    <span class="text-xs text-slate-400"><i class="fa-regular fa-clock"></i> ${escapeHtml(ticket.created_at)}</span>
                    ${ticket.status === 'prep' ?
                        `<button onclick="updateKDSStatus(${ticket.id}, 'ready')" class="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700">Mark Ready</button>` :
                        `<button onclick="updateKDSStatus(${ticket.id}, 'done')" class="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-brand-700">Complete</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

async function updateKDSStatus(orderId, status) {
    try {
        const res = await apiFetch(`/api/kds/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
        await Promise.all([loadKDS(), loadDashboard(false), loadTables()]);
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- INVENTORY ---
async function loadInventory() {
    inventoryList = await apiFetch('/api/inventory');
    const tbody = document.getElementById('inventoryTableBody');
    let lowCount = 0;

    tbody.innerHTML = inventoryList.map(item => {
        const isLow = Number(item.stock) <= Number(item.low_threshold);
        if (isLow) lowCount++;
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td class="p-4 font-semibold text-slate-800 dark:text-white">${escapeHtml(item.name)}</td>
                <td class="p-4 text-slate-500 dark:text-slate-400">${escapeHtml(item.category)}</td>
                <td class="p-4 font-bold ${isLow ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}">${Number(item.stock).toFixed(1)} ${escapeHtml(item.unit)}</td>
                <td class="p-4">
                    ${isLow ?
                        `<span class="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold">Low Stock (≤ ${item.low_threshold})</span>` :
                        `<span class="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">Optimal</span>`
                    }
                </td>
                <td class="p-4 text-right space-x-1">
                    <button onclick="adjustStock(${item.id}, -1)" class="text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg font-bold hover:opacity-80">-1</button>
                    <button onclick="adjustStock(${item.id}, 5)" class="text-xs bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 px-3 py-1.5 rounded-lg font-bold hover:bg-brand-100">+5 Restock</button>
                </td>
            </tr>
        `;
    }).join('');
    document.getElementById('lowStockBadge').innerText = lowCount;
}

async function adjustStock(id, delta) {
    try {
        const updated = await apiFetch(`/api/inventory/${id}/adjust`, {
            method: 'POST',
            body: JSON.stringify({ delta }),
        });
        await Promise.all([loadInventory(), loadDashboard(false)]);
        showToast(`${updated.name}: stock updated to ${updated.stock} ${updated.unit}`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleAddStockItem(e) {
    e.preventDefault();
    try {
        const payload = {
            name: document.getElementById('stockNameInput').value,
            category: document.getElementById('stockCategoryInput').value,
            unit: document.getElementById('stockUnitInput').value,
            stock: parseFloat(document.getElementById('stockQtyInput').value),
            low_threshold: parseFloat(document.getElementById('stockThresholdInput').value),
        };
        await apiFetch('/api/inventory', { method: 'POST', body: JSON.stringify(payload) });
        closeModal('addStockModal');
        document.getElementById('stockNameInput').value = '';
        await Promise.all([loadInventory(), loadDashboard(false)]);
        showToast('Inventory item added!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- ANALYTICS (Live SQLite Data) ---
async function loadAnalytics() {
    const data = await apiFetch('/api/analytics');
    document.getElementById('analyticsRevSplit').innerText =
        `POS: $${data.revenue_split.pos.toFixed(2)} | Rooms: $${data.revenue_split.rooms.toFixed(2)}`;
    document.getElementById('analyticsBookingStats').innerText =
        `Confirmed: ${data.booking_stats.confirmed} | In: ${data.booking_stats.checked_in} | Out: ${data.booking_stats.checked_out} | Cancelled: ${data.booking_stats.cancelled}`;
    document.getElementById('analyticsInventoryStats').innerText =
        `${data.inventory_summary.total_items} Tracked Items • ${data.inventory_summary.low_stock_count} Low-Stock Alerts`;

    if (salesChartInstance) salesChartInstance.destroy();
    if (topItemsChartInstance) topItemsChartInstance.destroy();

    const ctxSales = document.getElementById('salesChart').getContext('2d');
    salesChartInstance = new Chart(ctxSales, {
        type: 'line',
        data: {
            labels: data.revenue_trend.labels,
            datasets: [{
                label: 'Revenue ($)',
                data: data.revenue_trend.values,
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });

    const ctxItems = document.getElementById('topItemsChart').getContext('2d');
    topItemsChartInstance = new Chart(ctxItems, {
        type: 'bar',
        data: {
            labels: data.top_items.labels,
            datasets: [{
                label: 'Units Ordered',
                data: data.top_items.values,
                backgroundColor: '#10b981',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// --- MODALS & TOASTS ---
function populateModalDropdowns() {
    const availRooms = roomsList.filter(r => r.status === 'available');
    document.getElementById('checkInRoomSelect').innerHTML = availRooms.length
        ? availRooms.map(r => `<option value="${r.id}">Room ${escapeHtml(r.room_number)} (${escapeHtml(r.room_type)} - $${r.price_per_night}/night)</option>`).join('')
        : `<option value="">No available rooms</option>`;

    const availTables = tablesList.filter(t => t.status === 'available');
    document.getElementById('reserveTableSelect').innerHTML = availTables.length
        ? availTables.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (${t.capacity} seats)</option>`).join('')
        : `<option value="">No available tables</option>`;

    const dtInput = document.getElementById('reserveDateTime');
    if (dtInput && !dtInput.value) {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        dtInput.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
}

function openModal(id) {
    populateModalDropdowns();
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const icon = document.getElementById('toastIcon');
    toastMsg.innerText = message;

    if (type === 'error') {
        icon.className = 'fa-solid fa-circle-exclamation text-rose-400 text-base';
    } else {
        icon.className = 'fa-solid fa-circle-check text-emerald-400 text-base';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3200);
}