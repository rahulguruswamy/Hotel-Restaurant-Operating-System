from flask import Blueprint, jsonify, request
from database import get_db

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


@inventory_bp.route("", methods=["GET"])
def list_inventory():
    db = get_db()
    rows = db.execute("SELECT * FROM inventory ORDER BY name ASC").fetchall()
    return jsonify([dict(r) for r in rows])


@inventory_bp.route("", methods=["POST"])
def add_inventory_item():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    category = (data.get("category") or "").strip()
    unit = (data.get("unit") or "units").strip()

    try:
        stock = float(data.get("stock", 0))
        low_threshold = float(data.get("low_threshold", 5))
    except (TypeError, ValueError):
        return jsonify({"error": "Stock and low threshold must be valid numbers."}), 400

    if not name or not category or stock < 0 or low_threshold < 0:
        return jsonify({"error": "Valid item name, category, and non-negative quantities are required."}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)", (name,)).fetchone()
    if existing:
        return jsonify({"error": f"Inventory item '{name}' already exists."}), 409

    cur = db.execute(
        """INSERT INTO inventory (name, category, stock, unit, low_threshold)
           VALUES (?, ?, ?, ?, ?)""",
        (name, category, round(stock, 2), unit, round(low_threshold, 2)),
    )
    db.commit()
    created = db.execute("SELECT * FROM inventory WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(created)), 201


@inventory_bp.route("/<int:item_id>/adjust", methods=["POST"])
def adjust_inventory_stock(item_id):
    data = request.get_json(silent=True) or {}
    try:
        delta = float(data.get("delta", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Adjustment amount must be a number."}), 400

    db = get_db()
    item = db.execute("SELECT * FROM inventory WHERE id = ?", (item_id,)).fetchone()
    if not item:
        return jsonify({"error": "Inventory item not found."}), 404

    new_stock = round(float(item["stock"]) + delta, 2)
    if new_stock < 0:
        return jsonify({"error": "Stock cannot drop below 0."}), 400

    db.execute(
        "UPDATE inventory SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (new_stock, item_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM inventory WHERE id = ?", (item_id,)).fetchone()
    return jsonify(dict(updated))