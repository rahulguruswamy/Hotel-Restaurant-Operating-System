from flask import Blueprint, jsonify
from database import get_db

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


@dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    db = get_db()

    total_revenue = db.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'"
    ).fetchone()[0]

    today_revenue = db.execute(
        """SELECT COALESCE(SUM(amount), 0) FROM payments
           WHERE status = 'completed' AND DATE(created_at) = DATE('now', 'localtime')"""
    ).fetchone()[0]

    total_bookings = db.execute(
        "SELECT COUNT(*) FROM bookings WHERE status != 'cancelled'"
    ).fetchone()[0]

    total_rooms = db.execute("SELECT COUNT(*) FROM rooms").fetchone()[0]
    occupied_rooms = db.execute(
        "SELECT COUNT(*) FROM rooms WHERE status = 'occupied'"
    ).fetchone()[0]
    available_rooms = db.execute(
        "SELECT COUNT(*) FROM rooms WHERE status = 'available'"
    ).fetchone()[0]
    occupancy_pct = round((occupied_rooms / total_rooms) * 100) if total_rooms > 0 else 0

    total_tables = db.execute("SELECT COUNT(*) FROM restaurant_tables").fetchone()[0]
    active_tables = db.execute(
        "SELECT COUNT(*) FROM restaurant_tables WHERE status IN ('occupied', 'reserved')"
    ).fetchone()[0]

    pending_orders = db.execute(
        "SELECT COUNT(*) FROM orders WHERE kds_status != 'done'"
    ).fetchone()[0]

    low_stock_items = db.execute(
        "SELECT id, name, stock, unit, low_threshold FROM inventory WHERE stock <= low_threshold"
    ).fetchall()

    recent_payments = db.execute(
        """SELECT p.transaction_ref, p.amount, p.method, p.payment_type, p.created_at,
                  o.order_code, o.target, b.booking_ref
           FROM payments p
           LEFT JOIN orders o ON p.order_id = o.id
           LEFT JOIN bookings b ON p.booking_id = b.id
           ORDER BY p.created_at DESC, p.id DESC
           LIMIT 8"""
    ).fetchall()

    recent_bookings = db.execute(
        """SELECT b.booking_ref, b.status, b.created_at, r.room_number, g.full_name
           FROM bookings b
           JOIN rooms r ON b.room_id = r.id
           JOIN guests g ON b.guest_id = g.id
           ORDER BY b.created_at DESC, b.id DESC
           LIMIT 4"""
    ).fetchall()

    feed = []
    for p in recent_payments:
        label = (
            f"{p['target']} ({p['order_code']})"
            if p["payment_type"] == "pos" and p["order_code"]
            else f"Room Booking {p['booking_ref'] or ''}"
        )
        feed.append({
            "title": "Demo Payment Recorded" if p["payment_type"] == "pos" else "Room Payment",
            "desc": f"{label} - ${p['amount']:.2f} via {p['method'].upper()}",
            "time": str(p["created_at"]),
            "icon": "fa-file-invoice-dollar",
            "color": "text-brand-500 bg-brand-50",
        })

    for b in recent_bookings:
        feed.append({
            "title": f"Booking {b['status'].replace('_', ' ').title()}",
            "desc": f"{b['full_name']} — Room {b['room_number']} ({b['booking_ref']})",
            "time": str(b["created_at"]),
            "icon": "fa-key",
            "color": "text-emerald-500 bg-emerald-50",
        })

    for item in low_stock_items:
        feed.append({
            "title": "Low Stock Warning",
            "desc": f"{item['name']} is at {item['stock']} {item['unit']} (min {item['low_threshold']})",
            "time": "Inventory Alert",
            "icon": "fa-triangle-exclamation",
            "color": "text-amber-500 bg-amber-50",
        })

    feed.sort(key=lambda x: x["time"], reverse=True)

    return jsonify({
        "total_revenue": round(float(total_revenue), 2),
        "today_revenue": round(float(today_revenue), 2),
        "total_bookings": total_bookings,
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "available_rooms": available_rooms,
        "occupancy_pct": occupancy_pct,
        "total_tables": total_tables,
        "active_tables": active_tables,
        "pending_orders": pending_orders,
        "low_stock_count": len(low_stock_items),
        "activity_feed": feed[:10],
        "recent_transactions": [dict(r) for r in recent_payments],
    })