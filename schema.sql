PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT NOT NULL UNIQUE,
    room_type TEXT NOT NULL,
    price_per_night REAL NOT NULL CHECK (price_per_night > 0),
    status TEXT NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL DEFAULT '',
    id_proof TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ref TEXT NOT NULL UNIQUE,
    room_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    check_in_date TEXT NOT NULL,
    check_out_date TEXT NOT NULL,
    nights INTEGER NOT NULL CHECK (nights >= 1),
    total_amount REAL NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 1),
    status TEXT NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    guest_phone TEXT DEFAULT '',
    party_size INTEGER NOT NULL DEFAULT 2 CHECK (party_size >= 1),
    reservation_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'seated', 'completed', 'cancelled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    stock REAL NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unit TEXT NOT NULL DEFAULT 'units',
    low_threshold REAL NOT NULL DEFAULT 5 CHECK (low_threshold >= 0),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('mains', 'appetizers', 'drinks', 'desserts')),
    price REAL NOT NULL CHECK (price > 0),
    image_url TEXT DEFAULT '',
    inventory_item_id INTEGER,
    stock_deduction_qty REAL NOT NULL DEFAULT 0 CHECK (stock_deduction_qty >= 0),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    target TEXT NOT NULL,
    table_id INTEGER,
    booking_id INTEGER,
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount REAL NOT NULL CHECK (total_amount >= 0),
    kds_status TEXT NOT NULL DEFAULT 'prep' CHECK (kds_status IN ('prep', 'ready', 'done')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    line_total REAL NOT NULL CHECK (line_total >= 0),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_ref TEXT NOT NULL UNIQUE,
    order_id INTEGER,
    booking_id INTEGER,
    amount REAL NOT NULL CHECK (amount >= 0),
    method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'upi')),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('pos', 'room_booking')),
    is_demo INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);