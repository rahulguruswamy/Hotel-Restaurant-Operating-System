from datetime import date, timedelta
from flask import Blueprint, jsonify
from database import get_db

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.route("", methods=["GET"])
def get_analytics():
    db = get_db()

    # 1. Last 7 days revenue from actual payments table
    today = date.today()
    labels = []
    daily_totals = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        day_str = day.isoformat()
        labels.append(day.strftime("%a %d"))
        amt = db.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND DATE(created_at) = ?",
            (day_str,),
        ).fetchone()[0]
        daily_totals.append(round(float(amt), 2))

    # 2. Top ordered menu items from order_items
    top_items_rows = db.execute(
        """SELECT product_name, COALESCE(SUM(quantity), 0) AS total_qty
           FROM order_items
           GROUP BY product_name
           ORDER BY total_qty DESC
           LIMIT 5"""
    ).fetchall()

    # 3. Booking statistics
    booking_stats_rows = db.execute(
        "SELECT status, COUNT(*) AS cnt FROM bookings GROUP BY status"
    ).fetchall()
    booking_breakdown = {row["status"]: row["cnt"] for row in booking_stats_rows}

    pos_revenue = db.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND payment_type = 'pos'"
    ).fetchone()[0]
    room_revenue = db.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND payment_type = 'room_booking'"
    ).fetchone()[0]

    # 4. Inventory summary
    total_inventory = db.execute("SELECT COUNT(*) FROM inventory").fetchone()[0]
    low_stock_rows = db.execute(
        "SELECT name, stock, unit, low_threshold FROM inventory WHERE stock <= low_threshold ORDER BY stock ASC"
    ).fetchall()

    return jsonify({
        "revenue_trend": {
            "labels": labels,
            "values": daily_totals,
        },
        "top_items": {
            "labels": [r["product_name"] for r in top_items_rows],
            "values": [r["total_qty"] for r in top_items_rows],
        },
        "revenue_split": {
            "pos": round(float(pos_revenue), 2),
            "rooms": round(float(room_revenue), 2),
        },
        "booking_stats": {
            "confirmed": booking_breakdown.get("confirmed", 0),
            "checked_in": booking_breakdown.get("checked_in", 0),
            "checked_out": booking_breakdown.get("checked_out", 0),
            "cancelled": booking_breakdown.get("cancelled", 0),
        },
        "inventory_summary": {
            "total_items": total_inventory,
            "low_stock_count": len(low_stock_rows),
            "low_stock_items": [dict(r) for r in low_stock_rows],
        },
    })