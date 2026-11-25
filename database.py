import os
import sqlite3
from datetime import date, datetime, timedelta
from flask import current_app, g
from werkzeug.security import generate_password_hash


def get_db():
    if "db" not in g:
        db_path = current_app.config["DATABASE_PATH"]
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        g.db = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON;")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        db.executescript(f.read())
    seed_sample_data(db)


def seed_sample_data(db):
    # Only seed if core tables are empty so user edits persist across restarts
    existing_rooms = db.execute("SELECT COUNT(*) FROM rooms").fetchone()[0]
    if existing_rooms > 0:
        return

    # 1. Users (always hashed, never plain-text)
    users = [
        ("Sarah Jenkins", "sarah@hros.local", generate_password_hash("Manager@123"), "manager"),
        ("System Admin", "admin@hros.local", generate_password_hash("Admin@123"), "admin"),
    ]
    db.executemany(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        users,
    )

    # 2. Rooms
    rooms = [
        ("101", "Deluxe King", 160.00, "occupied"),
        ("102", "Double Queen", 140.00, "available"),
        ("103", "Executive Suite", 260.00, "occupied"),
        ("201", "Deluxe King", 160.00, "cleaning"),
        ("202", "Double Queen", 140.00, "available"),
        ("203", "Penthouse Suite", 420.00, "reserved"),
    ]
    db.executemany(
        "INSERT INTO rooms (room_number, room_type, price_per_night, status) VALUES (?, ?, ?, ?)",
        rooms,
    )

    # 3. Guests
    guests = [
        ("Alex Mercer", "alex.mercer@example.com", "+1-555-0101", "PASS-8821", "New York, NY"),
        ("Elena Rostova", "elena.r@example.com", "+1-555-0102", "PASS-4419", "Chicago, IL"),
        ("Johnathan Wick", "j.wick@example.com", "+1-555-0103", "DL-9910", "Boston, MA"),
    ]
    db.executemany(
        "INSERT INTO guests (full_name, email, phone, id_proof, address) VALUES (?, ?, ?, ?, ?)",
        guests,
    )

    today = date.today()
    d_minus_1 = (today - timedelta(days=1)).isoformat()
    d_plus_2 = (today + timedelta(days=2)).isoformat()
    d_plus_3 = (today + timedelta(days=3)).isoformat()
    d_plus_4 = (today + timedelta(days=4)).isoformat()

    # 4. Bookings
    bookings = [
        ("BK-1001", 1, 1, d_minus_1, d_plus_2, 3, 480.00, "checked_in", "Late checkout requested"),
        ("BK-1002", 3, 2, today.isoformat(), d_plus_3, 3, 780.00, "checked_in", "VIP fruit basket"),
        ("BK-1003", 6, 3, d_plus_2, d_plus_4, 2, 840.00, "confirmed", "Airport pickup"),
    ]
    db.executemany(
        """INSERT INTO bookings
           (booking_ref, room_id, guest_id, check_in_date, check_out_date, nights, total_amount, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        bookings,
    )

    # 5. Restaurant Tables
    tables = [
        ("T-01", "Table 01", 2, "occupied"),
        ("T-02", "Table 02", 4, "available"),
        ("T-03", "Table 03", 4, "occupied"),
        ("T-04", "Table 04", 6, "reserved"),
        ("T-05", "Table 05", 2, "available"),
        ("T-06", "Table 06", 8, "cleaning"),
        ("T-07", "Table 07", 4, "available"),
        ("T-08", "Table 08", 2, "available"),
    ]
    db.executemany(
        "INSERT INTO restaurant_tables (table_code, name, capacity, status) VALUES (?, ?, ?, ?)",
        tables,
    )

    # 6. Reservations
    res_time = (datetime.now() + timedelta(hours=2)).strftime("%Y-%m-%d %H:00")
    db.execute(
        """INSERT INTO reservations (table_id, guest_name, guest_phone, party_size, reservation_time, status)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (4, "Diana Prince", "+1-555-0188", 5, res_time, "confirmed"),
    )

    # 7. Inventory
    inventory_items = [
        ("Fresh Atlantic Salmon", "Seafood", 12.0, "kg", 15.0),
        ("Truffle Oil", "Pantry", 3.0, "bottles", 5.0),
        ("Aged Cheddar Cheese", "Dairy", 24.0, "kg", 10.0),
        ("Espresso Coffee Beans", "Beverage", 18.0, "bags", 8.0),
        ("Cotton Towels (Hotel)", "Housekeeping", 45.0, "sets", 20.0),
    ]
    db.executemany(
        "INSERT INTO inventory (name, category, stock, unit, low_threshold) VALUES (?, ?, ?, ?, ?)",
        inventory_items,
    )

    # 8. Menu Products (optionally linked to inventory items for automatic stock deduction)
    products = [
        ("Grilled Salmon Steak", "mains", 24.50,
         "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80", 1, 0.3),
        ("Truffle Pasta Fettuccine", "mains", 18.00,
         "https://images.unsplash.com/photo-1621996346565-e3d5d6281288?auto=format&fit=crop&w=300&q=80", 2, 0.1),
        ("Caesar Salad Bowl", "appetizers", 11.50,
         "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=300&q=80", 3, 0.2),
        ("Crispy Calamari", "appetizers", 13.00,
         "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80", None, 0),
        ("Iced Caramel Macchiato", "drinks", 6.50,
         "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=300&q=80", 4, 0.1),
        ("Fresh Mojito Cocktail", "drinks", 9.00,
         "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80", None, 0),
        ("Chocolate Lava Cake", "desserts", 8.50,
         "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=300&q=80", None, 0),
        ("Artisanal Gelato Trio", "desserts", 7.00,
         "https://images.unsplash.com/photo-1567206563064-6f60f4078b57?auto=format&fit=crop&w=300&q=80", None, 0),
    ]
    db.executemany(
        """INSERT INTO products (name, category, price, image_url, inventory_item_id, stock_deduction_qty)
           VALUES (?, ?, ?, ?, ?, ?)""",
        products,
    )

    # 9. Sample Orders + KDS Tickets + Payments across recent days for real analytics
    sample_orders = [
        ("ORD-1041", "Table 02", 2, None, 54.50, 9.81, 0.0, 64.31, "done", 2, "card"),
        ("ORD-1042", "Table 03", 3, None, 47.50, 8.55, 0.0, 56.05, "prep", 0, "cash"),
        ("ORD-1043", "Room 101", None, 1, 33.00, 5.94, 0.0, 38.94, "ready", 0, "upi"),
        ("ORD-1044", "Table 01", 1, None, 31.00, 5.58, 0.0, 36.58, "prep", 0, "card"),
    ]

    for idx, (code, target, tid, bid, sub, tax, disc, total, kds, days_ago, pay_method) in enumerate(sample_orders, start=1):
        ts = (datetime.now() - timedelta(days=days_ago, minutes=15 * idx)).strftime("%Y-%m-%d %H:%M:%S")
        cur = db.execute(
            """INSERT INTO orders
               (order_code, target, table_id, booking_id, subtotal, tax_amount, discount_amount, total_amount, kds_status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (code, target, tid, bid, sub, tax, disc, total, kds, ts),
        )
        order_id = cur.lastrowid
        db.execute(
            """INSERT INTO payments
               (transaction_ref, order_id, amount, method, payment_type, is_demo, status, created_at)
               VALUES (?, ?, ?, ?, 'pos', 1, 'completed', ?)""",
            (f"DEMO-{code}", order_id, total, pay_method, ts),
        )

    order_items = [
        (1, 1, "Grilled Salmon Steak", 2, 24.50, 49.00),
        (1, 5, "Iced Caramel Macchiato", 1, 6.50, 6.50),
        (2, 2, "Truffle Pasta Fettuccine", 2, 18.00, 36.00),
        (2, 3, "Caesar Salad Bowl", 1, 11.50, 11.50),
        (3, 1, "Grilled Salmon Steak", 1, 24.50, 24.50),
        (3, 7, "Chocolate Lava Cake", 1, 8.50, 8.50),
        (4, 6, "Fresh Mojito Cocktail", 2, 9.00, 18.00),
        (4, 4, "Crispy Calamari", 1, 13.00, 13.00),
    ]
    db.executemany(
        """INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?, ?)""",
        order_items,
    )

    # Sample room booking payment
    yesterday_ts = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
    db.execute(
        """INSERT INTO payments
           (transaction_ref, booking_id, amount, method, payment_type, is_demo, status, created_at)
           VALUES (?, ?, ?, ?, 'room_booking', 1, 'completed', ?)""",
        ("DEMO-BK-1001", 1, 480.00, "card", yesterday_ts),
    )

    db.commit()