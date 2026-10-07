import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShoppingBag,
  ChefHat,
  Bell,
  BarChart3,
  Flame,
  Star,
  Users,
  CreditCard,
  Wine,
  Sparkles,
  Plus,
  Minus,
  Check,
  X,
  Volume2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Coffee,
  Pizza,
  Filter,
  Eye,
  Send,
  MessageSquare,
  ThumbsUp,
  ShieldAlert
} from 'lucide-react';

const INITIAL_MENU = [
  {
    id: 'm1',
    name: 'Pan-Seared Wagyu Ribeye',
    category: 'Mains',
    station: 'Grill & Mains',
    price: 68,
    prepTime: '18 min',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
    description: 'A5 Miyazaki Wagyu served with truffle potato puree, grilled wild asparagus, and bone marrow jus.',
    allergens: ['Dairy', 'Gluten Free Option'],
    spicyLevel: 0,
    inStock: true,
    rating: 4.9,
    reviewCount: 38
  },
  {
    id: 'm2',
    name: 'Truffle & Wild Mushroom Tagliatelle',
    category: 'Mains',
    station: 'Grill & Mains',
    price: 34,
    prepTime: '12 min',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281282?auto=format&fit=crop&q=80&w=600',
    description: 'Fresh egg pasta tossed with black winter truffle cream, hand-picked chanterelles, and aged Parmigiano Reggiano.',
    allergens: ['Dairy', 'Gluten'],
    spicyLevel: 0,
    inStock: true,
    rating: 4.8,
    reviewCount: 52
  },
  {
    id: 'm3',
    name: 'Hamachi Yellowtail Carpaccio',
    category: 'Appetizers',
    station: 'Garde Manger',
    price: 26,
    prepTime: '8 min',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600',
    description: 'Sashimi grade yellowtail with yuzu ponzu, avocado mousse, thinly sliced serrano chilis, and micro cilantro.',
    allergens: ['Seafood', 'Soy'],
    spicyLevel: 1,
    inStock: true,
    rating: 4.7,
    reviewCount: 29
  },
  {
    id: 'm4',
    name: 'Roasted Beet & Burrata Salad',
    category: 'Appetizers',
    station: 'Garde Manger',
    price: 22,
    prepTime: '6 min',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19655?auto=format&fit=crop&q=80&w=600',
    description: 'Heirloom roasted beets, Puglia burrata, pistachio pesto, compressed figs, and aged balsamic glaze.',
    allergens: ['Nuts', 'Dairy'],
    spicyLevel: 0,
    inStock: true,
    rating: 4.6,
    reviewCount: 19
  },
  {
    id: 'm5',
    name: 'Smoked Old Fashioned',
    category: 'Beverages',
    station: 'Bar & Drinks',
    price: 20,
    prepTime: '4 min',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600',
    description: 'Bourbon, cherrywood smoke, Angostura bitters, organic maple syrup, charred orange wheel.',
    allergens: ['Alcohol'],
    spicyLevel: 0,
    inStock: true,
    rating: 4.9,
    reviewCount: 64
  },
  {
    id: 'm6',
    name: 'Passionfruit Hibiscus Cooler',
    category: 'Beverages',
    station: 'Bar & Drinks',
    price: 12,
    prepTime: '3 min',
    image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=600',
    description: 'Non-alcoholic botanical drink crafted with fresh passionfruit puree, cold-brewed hibiscus tea, and mint.',
    allergens: ['Vegan'],
    spicyLevel: 0,
    inStock: true,
    rating: 4.5,
    reviewCount: 15
  },
  {
    id: 'm7',
    name: 'Deconstructed Gold Leaf Tiramisu',
    category: 'Desserts',
    station: 'Pastry',
    price: 24,
    prepTime: '10 min',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=600',
    description: 'Espresso soaked savoiardi, mascarpone mousse, Valrhona cocoa dust, edible 24k gold leaf.',
    allergens: ['Dairy', 'Gluten', 'Alcohol'],
    spicyLevel: 0,
    inStock: true,
    rating: 4.95,
    reviewCount: 41
  }
];

const INITIAL_TABLES = [
  { id: 'T1', name: 'Table 1 (Window)', capacity: 2, status: 'Occupied', activeOrderId: 'ord-101' },
  { id: 'T2', name: 'Table 2 (Booth)', capacity: 4, status: 'Idle', activeOrderId: null },
  { id: 'T3', name: 'Table 3 (Patio)', capacity: 4, status: 'Idle', activeOrderId: null },
  { id: 'T4', name: 'Table 4 (VIP Lounge)', capacity: 6, status: 'Occupied', activeOrderId: 'ord-102' },
  { id: 'R201', name: 'Room 201 (Penthouse)', capacity: 2, status: 'Occupied', activeOrderId: 'ord-103' },
  { id: 'R202', name: 'Room 202 (Suite)', capacity: 2, status: 'Idle', activeOrderId: null }
];

const INITIAL_ORDERS = [
  {
    id: 'ord-101',
    tableId: 'T1',
    tableName: 'Table 1',
    customerName: 'Alexander Wright',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    status: 'In Progress', // Pending -> In Progress -> Ready -> Served -> Paid
    courseFiring: 'Sequential', // 'Sequential' | 'Simultaneous'
    items: [
      {
        orderItemId: 'item-1',
        menuId: 'm3',
        name: 'Hamachi Yellowtail Carpaccio',
        category: 'Appetizers',
        station: 'Garde Manger',
        price: 26,
        quantity: 1,
        spiceLevel: 1,
        notes: 'Extra yuzu ponzu on side',
        status: 'Ready', // Pending -> Cooking -> Ready -> Delivered
        course: 'Appetizer'
      },
      {
        orderItemId: 'item-2',
        menuId: 'm1',
        name: 'Pan-Seared Wagyu Ribeye',
        category: 'Mains',
        station: 'Grill & Mains',
        price: 68,
        quantity: 1,
        spiceLevel: 0,
        notes: 'Medium Rare, hold the bone marrow jus',
        status: 'Cooking',
        course: 'Main'
      }
    ],
    tipAmount: 0,
    paid: false,
    reviewed: false
  },
  {
    id: 'ord-102',
    tableId: 'T4',
    tableName: 'Table 4',
    customerName: 'Elena Rostova',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    status: 'In Progress',
    courseFiring: 'Simultaneous',
    items: [
      {
        orderItemId: 'item-3',
        menuId: 'm2',
        name: 'Truffle & Wild Mushroom Tagliatelle',
        category: 'Mains',
        station: 'Grill & Mains',
        price: 34,
        quantity: 2,
        spiceLevel: 0,
        notes: 'Extra parmesan cheese',
        status: 'Cooking',
        course: 'Main'
      },
      {
        orderItemId: 'item-4',
        menuId: 'm5',
        name: 'Smoked Old Fashioned',
        category: 'Beverages',
        station: 'Bar & Drinks',
        price: 20,
        quantity: 2,
        spiceLevel: 0,
        notes: 'Extra smoky please',
        status: 'Ready',
        course: 'Beverage'
      }
    ],
    tipAmount: 0,
    paid: false,
    reviewed: false
  }
];

export default function App() {
  // Global State across views (Simulates shared database / WebSockets)
  const [activeRole, setActiveRole] = useState('customer'); // 'customer' | 'kitchen' | 'server' | 'admin'
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [selectedTable, setSelectedTable] = useState('T4'); // Default active customer table
  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'Table 4: Smoked Old Fashioned is READY at Bar station', time: '1m ago', read: false },
    { id: 'n2', text: 'Table 1: Hamachi Carpaccio marked READY by Garde Manger', time: '4m ago', read: false }
  ]);
  const [reviews, setReviews] = useState([
    { id: 'r1', dishName: 'Pan-Seared Wagyu Ribeye', rating: 5, comment: 'Cooked to perfection! Melted in my mouth.', author: 'Jonathan M.' },
    { id: 'r2', dishName: 'Smoked Old Fashioned', rating: 5, comment: 'Best cocktail presentation in the hotel!', author: 'Elena R.' }
  ]);

  // Audio / visual alert trigger simulation helper
  const addNotification = (text) => {
    const newNotif = {
      id: 'notif-' + Date.now(),
      text,
      time: 'Just now',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Synchronize item status updates across Kitchen and Customer
  const updateItemStatus = (orderId, orderItemId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id === orderId) {
          const updatedItems = ord.items.map((item) => {
            if (item.orderItemId === orderItemId) {
              return { ...item, status: newStatus };
            }
            return item;
          });

          // Check overall order status derived from items
          const allDelivered = updatedItems.every((i) => i.status === 'Delivered');
          const allReadyOrDelivered = updatedItems.every((i) => i.status === 'Ready' || i.status === 'Delivered');
          
          let overallStatus = ord.status;
          if (allDelivered) overallStatus = 'Served';
          else if (allReadyOrDelivered) overallStatus = 'Ready to Serve';
          else overallStatus = 'In Progress';

          return { ...ord, items: updatedItems, status: overallStatus };
        }
        return ord;
      })
    );
  };

  // Toggle item stock state (Kitchen -> Customer instant sync)
  const toggleItemStock = (menuId) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === menuId) {
          const updated = !item.inStock;
          addNotification(`${item.name} is now ${updated ? 'IN STOCK' : 'OUT OF STOCK (86ed)'}`);
          return { ...item, inStock: updated };
        }
        return item;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header & Interactive Role Switcher Bar */}
      {}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Hotel Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-white block leading-tight">
                LUMINA
              </span>
              <span className="text-[10px] tracking-widest text-amber-400 font-semibold uppercase">
                Hotel & Dining System
              </span>
            </div>
          </div>

          {/* Role Navigation Switcher Pills */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-950/70 p-1.5 rounded-full border border-slate-800">
            <button
              onClick={() => setActiveRole('customer')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeRole === 'customer'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guest Menu</span>
              <span className="sm:hidden">Guest</span>
            </button>

            <button
              onClick={() => setActiveRole('kitchen')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all relative ${
                activeRole === 'kitchen'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kitchen (KDS)</span>
              <span className="sm:hidden">Kitchen</span>
              {orders.some((o) => o.items.some((i) => i.status === 'Pending')) && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => setActiveRole('server')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all relative ${
                activeRole === 'server'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Server Floor</span>
              <span className="sm:hidden">Server</span>
              {orders.some((o) => o.items.some((i) => i.status === 'Ready')) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => setActiveRole('admin')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeRole === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </nav>

          {/* Quick Notification Counter */}
          <div className="flex items-center space-x-3">
            <div className="relative cursor-pointer">
              <Bell className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-slate-900" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeRole === 'customer' && (
          <CustomerView
            menuItems={menuItems}
            orders={orders}
            setOrders={setOrders}
            tables={tables}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            addNotification={addNotification}
            reviews={reviews}
            setReviews={setReviews}
          />
        )}

        {activeRole === 'kitchen' && (
          <KitchenView
            orders={orders}
            menuItems={menuItems}
            updateItemStatus={updateItemStatus}
            toggleItemStock={toggleItemStock}
            addNotification={addNotification}
          />
        )}

        {activeRole === 'server' && (
          <ServerView
            orders={orders}
            tables={tables}
            updateItemStatus={updateItemStatus}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        )}

        {activeRole === 'admin' && (
          <AdminView
            orders={orders}
            menuItems={menuItems}
            reviews={reviews}
            setMenuItems={setMenuItems}
          />
        )}
      </main>

      {/* Footer Branding Info */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>Lumina Luxury Hospitality OS • Real-time Sync Engine Active</p>
      </footer>
    </div>
  );
}

/* ==========================================================================
   1. CUSTOMER PORTAL VIEW (QR MENU, ORDERING, LIVE TRACKER, REVIEW & TIP)
   ========================================================================== */
function CustomerView({
  menuItems,
  orders,
  setOrders,
  tables,
  selectedTable,
  setSelectedTable,
  addNotification,
  reviews,
  setReviews
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [spiceChoice, setSpiceChoice] = useState(0);
  const [specialNotes, setSpecialNotes] = useState('');
  const [courseChoice, setCourseChoice] = useState('Sequential'); // 'Sequential' | 'Simultaneous'
  const [showCartModal, setShowCartModal] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState({});
  const [reviewComments, setReviewComments] = useState({});
  const [tipPercentage, setTipPercentage] = useState(18);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Active customer order for current selected table/room
  const currentOrder = useMemo(() => {
    return orders.find((o) => o.tableId === selectedTable && o.status !== 'Paid');
  }, [orders, selectedTable]);

  const categories = ['All', 'Appetizers', 'Mains', 'Beverages', 'Desserts'];

  const filteredMenuItems = menuItems.filter((item) =>
    activeCategory === 'All' ? true : item.category === activeCategory
  );

  const addToCart = (item) => {
    if (!item.inStock) return;
    setCustomizingItem(item);
    setSpiceChoice(item.spicyLevel);
    setSpecialNotes('');
  };

  const confirmAddToCart = () => {
    if (!customizingItem) return;
    const cartItem = {
      cartId: 'c-' + Date.now(),
      menuId: customizingItem.id,
      name: customizingItem.name,
      category: customizingItem.category,
      station: customizingItem.station,
      price: customizingItem.price,
      spiceLevel: spiceChoice,
      notes: specialNotes,
      course: customizingItem.category === 'Appetizers' ? 'Appetizer' : customizingItem.category === 'Mains' ? 'Main' : 'Beverage'
    };
    setCart((prev) => [...prev, cartItem]);
    setCustomizingItem(null);
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const newOrderId = 'ord-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id: newOrderId,
      tableId: selectedTable,
      tableName: tables.find((t) => t.id === selectedTable)?.name || selectedTable,
      customerName: 'Guest (' + selectedTable + ')',
      timestamp: new Date().toISOString(),
      status: 'In Progress',
      courseFiring: courseChoice,
      items: cart.map((c, idx) => ({
        orderItemId: 'item-' + Date.now() + '-' + idx,
        menuId: c.menuId,
        name: c.name,
        category: c.category,
        station: c.station,
        price: c.price,
        quantity: 1,
        spiceLevel: c.spiceLevel,
        notes: c.notes,
        status: 'Pending',
        course: c.course
      })),
      tipAmount: 0,
      paid: false,
      reviewed: false
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setShowCartModal(false);
    addNotification(`New order placed by ${newOrder.tableName}! Items sent to Kitchen.`);
  };

  // Submit Post-Meal Dish Reviews
  const handleSubmitReviews = () => {
    if (!currentOrder) return;

    currentOrder.items.forEach((item) => {
      const rating = selectedRating[item.orderItemId] || 5;
      const comment = reviewComments[item.orderItemId] || 'Exquisite meal!';

      setReviews((prev) => [
        {
          id: 'rev-' + Date.now() + Math.random(),
          dishName: item.name,
          rating,
          comment,
          author: currentOrder.customerName
        },
        ...prev
      ]);
    });

    setReviewModalOpen(false);
    setPaymentSuccess(true);

    // Mark Order as Paid and completed
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.id === currentOrder.id ? { ...o, status: 'Paid', paid: true } : o))
      );
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Table Selector Header (Simulating scanning a table QR code) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Select Your Dining Location</h2>
            <p className="text-xs text-slate-400">Simulate scanning a table QR code or Room TV</p>
          </div>
        </div>

        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-amber-400 text-sm font-semibold rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
        >
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.status})
            </option>
          ))}
        </select>
      </div>

      {/* Active Order Live Tracker Banner (If Guest has an order in progress) */}
      {currentOrder && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1">
                <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>Live Kitchen Status • Order #{currentOrder.id}</span>
              </div>
              <h3 className="text-xl font-bold text-white">Your Culinary Experience in Progress</h3>
              <p className="text-xs text-slate-400 mt-1">
                Course Fire Preference: <span className="text-slate-200 font-medium">{currentOrder.courseFiring}</span>
              </p>
            </div>

            {/* Actions: Request Bill / Review */}
            <div className="flex items-center space-x-3">
              {currentOrder.items.every((i) => i.status === 'Delivered') && !currentOrder.paid && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
                >
                  <Star className="w-4 h-4 fill-slate-950" />
                  <span>Review & Pay Bill</span>
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress per Dish */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentOrder.items.map((item) => {
              const statusStep =
                item.status === 'Pending'
                  ? 1
                  : item.status === 'Cooking'
                  ? 2
                  : item.status === 'Ready'
                  ? 3
                  : 4;

              return (
                <div key={item.orderItemId} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-white">{item.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Delivered'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.status === 'Ready'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 transition-all duration-500"
                      style={{ width: `${(statusStep / 4) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                    <span className={statusStep >= 1 ? 'text-amber-400 font-semibold' : ''}>Order Sent</span>
                    <span className={statusStep >= 2 ? 'text-amber-400 font-semibold' : ''}>Cooking</span>
                    <span className={statusStep >= 3 ? 'text-amber-400 font-semibold' : ''}>Ready</span>
                    <span className={statusStep >= 4 ? 'text-emerald-400 font-semibold' : ''}>Served</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Floating Cart Launcher Button */}
        {cart.length > 0 && (
          <button
            onClick={() => setShowCartModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Cart ({cart.length})</span>
            <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded-md ml-1 font-mono">${cartTotal}</span>
          </button>
        )}
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenuItems.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900 border ${
              item.inStock ? 'border-slate-800 hover:border-slate-700' : 'border-red-900/30 opacity-60'
            } rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all group`}
          >
            <div>
              <div className="relative h-48 overflow-hidden bg-slate-950">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {!item.inStock && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-bold text-xs tracking-wider uppercase">
                      Sold Out / 86ed
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-xs font-semibold text-amber-400 flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-amber-400 font-mono font-bold text-lg">${item.price}</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>

                {/* Allergen & Station Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                    Station: {item.station}
                  </span>
                  {item.allergens.map((alg) => (
                    <span
                      key={alg}
                      className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                disabled={!item.inStock}
                onClick={() => addToCart(item)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                  item.inStock
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Customize & Add to Order</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dish Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">{customizingItem.name}</h3>
                <p className="text-xs text-amber-400 font-mono font-semibold">${customizingItem.price}</p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spice Preference */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Spice Level Preference</label>
              <div className="grid grid-cols-4 gap-2">
                {['None', 'Mild', 'Medium', 'Extra Hot'].map((lvl, index) => (
                  <button
                    key={lvl}
                    onClick={() => setSpiceChoice(index)}
                    className={`py-2 text-xs rounded-xl border font-medium transition-all ${
                      spiceChoice === index
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Special Requests / Allergy Notes
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g., Sauce on the side, allergic to peanuts..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 h-20 resize-none"
              />
            </div>

            <button
              onClick={confirmAddToCart}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              Add to Order Ticket
            </button>
          </div>
        </div>
      )}

      {/* Cart & Firing Preference Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>Review Order Ticket ({cart.length})</span>
              </h3>
              <button onClick={() => setShowCartModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {cart.map((item) => (
                <div
                  key={item.cartId}
                  className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <p className="text-[10px] text-slate-400">
                      Station: {item.station} {item.notes && `• Note: "${item.notes}"`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-amber-400">${item.price}</span>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Course Firing System Option */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <label className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
                Kitchen Course Fire Timing
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCourseChoice('Sequential')}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    courseChoice === 'Sequential'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">Sequential Course</div>
                  <div className="text-[10px] text-slate-500">Serve Appetizers first, then Mains</div>
                </button>

                <button
                  onClick={() => setCourseChoice('Simultaneous')}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    courseChoice === 'Simultaneous'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">Serve As Prepared</div>
                  <div className="text-[10px] text-slate-500">Deliver as soon as ready</div>
                </button>
              </div>
            </div>

            {/* Total and Place Order Button */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Order Amount</span>
                <p className="text-xl font-mono font-bold text-amber-400">${cartTotal}</p>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Transmit to Kitchen Stations</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Meal Item Review & Payment Modal */}
      {reviewModalOpen && currentOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>Rate Your Dining Experience</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Please provide item-specific feedback for our chefs and culinary team.
              </p>
            </div>

            {/* Individual Item Ratings */}
            <div className="space-y-4">
              {currentOrder.items.map((item) => (
                <div key={item.orderItemId} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-white">{item.name}</span>
                    {/* Star Rating selector */}
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() =>
                            setSelectedRating((prev) => ({ ...prev, [item.orderItemId]: star }))
                          }
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              (selectedRating[item.orderItemId] || 5) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Feedback for chef regarding this dish..."
                    value={reviewComments[item.orderItemId] || ''}
                    onChange={(e) =>
                      setReviewComments((prev) => ({ ...prev, [item.orderItemId]: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>

            {/* Digital Tip & Payment Section */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-400 block">Staff Gratuity / Tip</span>
              <div className="grid grid-cols-4 gap-2">
                {[15, 18, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setTipPercentage(pct)}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      tipPercentage === pct
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between text-xs text-slate-300">
                <span>Subtotal: ${currentOrder.items.reduce((sum, i) => sum + i.price, 0)}</span>
                <span>
                  Tip: $
                  {(
                    (currentOrder.items.reduce((sum, i) => sum + i.price, 0) * tipPercentage) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {paymentSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center text-emerald-400 text-xs font-bold">
                Payment Processed & Reviews Submitted! Thank you for dining with Lumina.
              </div>
            ) : (
              <button
                onClick={handleSubmitReviews}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Complete Payment & Submit Feedback</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   2. KITCHEN DISPLAY SYSTEM (KDS) - STATION SEGREGATION & STOCK TOGGLES
   ========================================================================== */
function KitchenView({ orders, menuItems, updateItemStatus, toggleItemStock, addNotification }) {
  const [selectedStation, setSelectedStation] = useState('All Stations');

  const stations = ['All Stations', 'Garde Manger', 'Grill & Mains', 'Bar & Drinks', 'Pastry'];

  // Flatten active order tickets filtered by station
  const activeStationTickets = useMemo(() => {
    let list = [];
    orders.forEach((order) => {
      if (order.status === 'Paid') return;

      order.items.forEach((item) => {
        if (selectedStation !== 'All Stations' && item.station !== selectedStation) return;
        list.push({
          orderId: order.id,
          tableName: order.tableName,
          customerName: order.customerName,
          timestamp: order.timestamp,
          courseFiring: order.courseFiring,
          ...item
        });
      });
    });
    return list;
  }, [orders, selectedStation]);

  return (
    <div className="space-y-6">
      {/* Station Selector Bar & Stock Toggles Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Kitchen Display System (KDS)</h2>
            <p className="text-xs text-slate-400">Station-routed order segregation & live timer tracking</p>
          </div>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {stations.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStation(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStation === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Management Drawer / Quick Toggle Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Quick 86 / Out of Stock Toggle (Updates Customer Menu Instantly)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItemStock(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-2 ${
                item.inStock
                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-red-500/10 border-red-500/40 text-red-400 line-through'
              }`}
            >
              <span>{item.name}</span>
              <span className={`w-2 h-2 rounded-full ${item.inStock ? 'bg-emerald-400' : 'bg-red-500'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Active Kitchen Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeStationTickets.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">No active cooking tickets for this station.</p>
          </div>
        ) : (
          activeStationTickets.map((ticket) => {
            const minutesElapsed = Math.floor(
              (Date.now() - new Date(ticket.timestamp).getTime()) / 60000
            );
            const isLate = minutesElapsed > 15;

            return (
              <div
                key={ticket.orderItemId}
                className={`bg-slate-900 border ${
                  isLate ? 'border-red-500/50 shadow-red-500/10' : 'border-slate-800'
                } rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden`}
              >
                {isLate && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold uppercase px-3 py-0.5 rounded-bl-xl tracking-wider">
                    Bottleneck Warning ({minutesElapsed}m)
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-3">
                    <div>
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                        {ticket.tableName}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{ticket.name}</h4>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{minutesElapsed}m ago</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Station:</span>
                      <span className="text-slate-200 font-semibold">{ticket.station}</span>
                    </div>

                    {ticket.notes && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-amber-300 font-medium">
                        Note: "{ticket.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Action Buttons */}
                <div className="pt-2">
                  {ticket.status === 'Pending' && (
                    <button
                      onClick={() => updateItemStatus(ticket.orderId, ticket.orderItemId, 'Cooking')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Cooking Dish</span>
                    </button>
                  )}

                  {ticket.status === 'Cooking' && (
                    <button
                      onClick={() => {
                        updateItemStatus(ticket.orderId, ticket.orderItemId, 'Ready');
                        addNotification(`${ticket.tableName}: ${ticket.name} is READY at ${ticket.station}`);
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Ready for Server</span>
                    </button>
                  )}

                  {ticket.status === 'Ready' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-2.5 rounded-xl text-xs font-bold text-center">
                      Waiting for Server Pickup
                    </div>
                  )}

                  {ticket.status === 'Delivered' && (
                    <div className="bg-slate-950 text-slate-500 py-2 rounded-xl text-xs font-semibold text-center">
                      Delivered to Table
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   3. SERVER / WAITSTAFF DASHBOARD - TABLE MAP & READY ALERTS
   ========================================================================== */
function ServerView({ orders, tables, updateItemStatus, notifications, setNotifications }) {
  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="space-y-6">
      {/* Live Server Notification Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
          <Bell className="w-4 h-4 animate-bounce" />
          <span>Live Kitchen Ready Feed</span>
        </h3>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500">No recent server alerts.</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-3 rounded-xl border text-xs flex justify-between items-center transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-950 border-slate-800 text-slate-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold'
                }`}
              >
                <span>{notif.text}</span>
                <span className="text-[10px] text-slate-500 font-mono ml-2">{notif.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Table Status Floor Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>Dining Floor & Room Status Map</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => {
            const activeOrder = orders.find((o) => o.tableId === table.id && o.status !== 'Paid');

            return (
              <div
                key={table.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm">{table.name}</h4>
                      <p className="text-[10px] text-slate-400">Capacity: {table.capacity} Guests</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        activeOrder
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {activeOrder ? 'Occupied' : 'Idle / Available'}
                    </span>
                  </div>

                  {/* Active Items at Table */}
                  {activeOrder ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Order #{activeOrder.id} Items:
                      </span>
                      {activeOrder.items.map((item) => (
                        <div
                          key={item.orderItemId}
                          className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs"
                        >
                          <div>
                            <span className="text-white font-medium block">{item.name}</span>
                            <span className="text-[10px] text-slate-500">From {item.station}</span>
                          </div>

                          {item.status === 'Ready' ? (
                            <button
                              onClick={() =>
                                updateItemStatus(activeOrder.id, item.orderItemId, 'Delivered')
                              }
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Deliver Now</span>
                            </button>
                          ) : (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                item.status === 'Delivered'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-blue-400 bg-blue-500/10'
                              }`}
                            >
                              {item.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-4 text-center">
                      Table ready for guest seating.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. ADMIN & ANALYTICS DASHBOARD - BOTTLENECKS, REVENUE & DISH PERFORMANCE
   ========================================================================== */
function AdminView({ orders, menuItems, reviews, setMenuItems }) {
  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, ord) => {
      const orderTotal = ord.items.reduce((iSum, item) => iSum + item.price, 0);
      return sum + orderTotal;
    }, 0);
  }, [orders]);

  const totalOrdersCount = orders.length;

  return (
    <div className="space-y-8">
      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Sales Revenue</span>
            <span className="text-2xl font-mono font-bold text-amber-400 mt-1 block">${totalRevenue}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Active Guest Orders</span>
            <span className="text-2xl font-mono font-bold text-white mt-1 block">{totalOrdersCount}</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Avg Kitchen Prep Time</span>
            <span className="text-2xl font-mono font-bold text-white mt-1 block">11.4 min</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Guest Feedback Rating</span>
            <span className="text-2xl font-mono font-bold text-white mt-1 block">4.88 / 5</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* Dish Performance Leaderboard & Customer Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu Dish Analytics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Dish Rating Leaderboard</span>
          </h3>

          <div className="space-y-3">
            {menuItems.map((dish) => (
              <div
                key={dish.id}
                className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{dish.name}</h4>
                  <p className="text-[10px] text-slate-400">
                    Station: {dish.station} • Price: ${dish.price}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{dish.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Guest Reviews Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Post-Meal Guest Dish Feedback</span>
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{rev.dishName}</span>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>
                <span className="text-[10px] text-slate-500 font-medium block">— {rev.author}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}