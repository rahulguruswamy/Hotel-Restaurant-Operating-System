# HROS Pro – Hotel & Restaurant Operating System (Python Flask + SQLite)

A full-stack Hotel & Restaurant Management System built with **Python 3, Flask, and SQLite**, preserving the HROS Pro Tailwind interface.

## Features
- **Dashboard:** Live total/daily revenue, room occupancy, available rooms, active tables, pending kitchen orders, and recent database transactions.
- **Room Management:** Add, edit, delete rooms, view availability, and manage housekeeping status.
- **Guest Management:** Add, edit, search guests, and check guests in/out.
- **Booking Management:** Date-range bookings with server-side overlap prevention, nightly rate calculation, check-in, check-out, and cancellation.
- **Restaurant & Table Management:** Table floor status visualizer, dining reservations, and seating tracking.
- **POS & Billing (Demo Payment Workflow):** Dynamic menu, cart, 18% tax/service, 10% VIP discount, automatic SQLite inventory deduction, and printable receipts.
- **Kitchen Display System (KDS):** Live order queue (`prep` → `ready` → `done`).
- **Inventory Management:** Add items, restock/adjust quantities, low-stock warnings.
- **Analytics:** Live 7-day revenue trend, top ordered items, revenue split, and booking/inventory summaries.
- **Staff Security:** Password-hashed accounts (`werkzeug.security`) stored in SQLite; parameterized SQL queries throughout.

## Project Structure
- `app.py` – Flask app entry point
- `config.py` – Configuration & tax/discount constants
- `database.py` – SQLite connection, automatic schema creation, and sample data seeding
- `schema.sql` – Relational database schema (11 tables with primary/foreign keys)
- `routes/` – Modular Flask Blueprints (`auth`, `dashboard`, `hotel`, `restaurant`, `inventory`, `analytics`)
- `templates/index.html` – HROS Pro frontend template
- `static/css/style.css` & `static/js/app.js` – Styles & API integration

## Database Initialization
No manual database setup is required. When `app.py` starts, it automatically creates `instance/hotel.db` from `schema.sql` and seeds initial demo records if empty.

## Demo Staff Login
- **Email:** `sarah@hros.local`
- **Password:** `Manager@123`
*(Passwords are stored as salted cryptographic hashes, never plain text.)*