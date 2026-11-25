from datetime import date, datetime, timedelta
from flask import Blueprint, jsonify, request
from database import get_db

hotel_bp = Blueprint("hotel", __name__, url_prefix="/api")

VALID_ROOM_STATUSES = {"available", "occupied", "reserved", "cleaning", "maintenance"}


def _parse_dates(check_in_str, check_out_str):
    try:
        d_in = datetime.strptime(check_in_str, "%Y-%m-%d").date()
        d_out = datetime.strptime(check_out_str, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None, None, "Dates must be in YYYY-MM-DD format."
    if d_out <= d_in:
        return None, None, "Check-out date must be after check-in date."
    return d_in, d_out, None


def _has_overlapping_booking(db, room_id, check_in_str, check_out_str, exclude_booking_id=None):
    query = """
        SELECT id, booking_ref, check_in_date, check_out_date
        FROM bookings
        WHERE room_id = ?
          AND status IN ('confirmed', 'checked_in')
          AND check_in_date < ?
          AND check_out_date > ?
    """
    params = [room_id, check_out_str, check_in_str]
    if exclude_booking_id is not None:
        query += " AND id != ?"
        params.append(exclude_booking_id)
    return db.execute(query, params).fetchone()


# ---------------- ROOMS ----------------

@hotel_bp.route("/rooms", methods=["GET"])
def list_rooms():
    db = get_db()
    rows = db.execute(
        """SELECT r.*,
                  b.id AS active_booking_id,
                  b.booking_ref,
                  g.full_name AS current_guest
           FROM rooms r
           LEFT JOIN bookings b ON b.room_id = r.id AND b.status = 'checked_in'
           LEFT JOIN guests g ON b.guest_id = g.id
           ORDER BY r.room_number ASC"""
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@hotel_bp.route("/rooms/available", methods=["GET"])
def available_rooms_for_dates():
    check_in = request.args.get("check_in")
    check_out = request.args.get("check_out")
    db = get_db()

    if check_in and check_out:
        _, _, err = _parse_dates(check_in, check_out)
        if err:
            return jsonify({"error": err}), 400
        rows = db.execute(
            """SELECT * FROM rooms
               WHERE status != 'maintenance'
                 AND id NOT IN (
                     SELECT room_id FROM bookings
                     WHERE status IN ('confirmed', 'checked_in')
                       AND check_in_date < ?
                       AND check_out_date > ?
                 )
               ORDER BY room_number ASC""",
            (check_out, check_in),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM rooms WHERE status = 'available' ORDER BY room_number ASC"
        ).fetchall()

    return jsonify([dict(r) for r in rows])


@hotel_bp.route("/rooms", methods=["POST"])
def create_room():
    data = request.get_json(silent=True) or {}
    room_number = (data.get("room_number") or "").strip()
    room_type = (data.get("room_type") or "").strip()
    status = (data.get("status") or "available").strip().lower()

    try:
        price = float(data.get("price_per_night", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Price per night must be a valid number."}), 400

    if not room_number or not room_type:
        return jsonify({"error": "Room number and room type are required."}), 400
    if price <= 0:
        return jsonify({"error": "Price per night must be greater than 0."}), 400
    if status not in VALID_ROOM_STATUSES:
        return jsonify({"error": "Invalid room status."}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM rooms WHERE room_number = ?", (room_number,)).fetchone()
    if existing:
        return jsonify({"error": f"Room {room_number} already exists."}), 409

    cur = db.execute(
        "INSERT INTO rooms (room_number, room_type, price_per_night, status) VALUES (?, ?, ?, ?)",
        (room_number, room_type, round(price, 2), status),
    )
    db.commit()
    room = db.execute("SELECT * FROM rooms WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(room)), 201


@hotel_bp.route("/rooms/<int:room_id>", methods=["PUT"])
def update_room(room_id):
    data = request.get_json(silent=True) or {}
    db = get_db()
    room = db.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
    if not room:
        return jsonify({"error": "Room not found."}), 404

    room_number = (data.get("room_number") or room["room_number"]).strip()
    room_type = (data.get("room_type") or room["room_type"]).strip()
    status = (data.get("status") or room["status"]).strip().lower()

    try:
        price = float(data.get("price_per_night", room["price_per_night"]))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid price per night."}), 400

    if not room_number or not room_type or price <= 0 or status not in VALID_ROOM_STATUSES:
        return jsonify({"error": "Invalid room details provided."}), 400

    dup = db.execute(
        "SELECT id FROM rooms WHERE room_number = ? AND id != ?", (room_number, room_id)
    ).fetchone()
    if dup:
        return jsonify({"error": f"Room {room_number} already exists."}), 409

    db.execute(
        """UPDATE rooms
           SET room_number = ?, room_type = ?, price_per_night = ?, status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (room_number, room_type, round(price, 2), status, room_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
    return jsonify(dict(updated))


@hotel_bp.route("/rooms/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    db = get_db()
    room = db.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
    if not room:
        return jsonify({"error": "Room not found."}), 404

    active = db.execute(
        "SELECT id FROM bookings WHERE room_id = ? AND status IN ('confirmed', 'checked_in')",
        (room_id,),
    ).fetchone()
    if active:
        return jsonify({"error": "Cannot delete a room with active or upcoming bookings."}), 409

    has_history = db.execute("SELECT id FROM bookings WHERE room_id = ?", (room_id,)).fetchone()
    if has_history:
        return jsonify({"error": "Room has historical booking records. Set status to maintenance instead."}), 409

    db.execute("DELETE FROM rooms WHERE id = ?", (room_id,))
    db.commit()
    return jsonify({"message": f"Room {room['room_number']} deleted."})


# ---------------- GUESTS ----------------

@hotel_bp.route("/guests", methods=["GET"])
def list_guests():
    q = (request.args.get("q") or "").strip()
    db = get_db()
    if q:
        like = f"%{q}%"
        rows = db.execute(
            """SELECT * FROM guests
               WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR id_proof LIKE ?
               ORDER BY id DESC""",
            (like, like, like, like),
        ).fetchall()
    else:
        rows = db.execute("SELECT * FROM guests ORDER BY id DESC").fetchall()
    return jsonify([dict(r) for r in rows])


@hotel_bp.route("/guests", methods=["POST"])
def create_guest():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip()
    id_proof = (data.get("id_proof") or "").strip()
    address = (data.get("address") or "").strip()

    if not full_name:
        return jsonify({"error": "Guest full name is required."}), 400

    db = get_db()
    cur = db.execute(
        """INSERT INTO guests (full_name, email, phone, id_proof, address)
           VALUES (?, ?, ?, ?, ?)""",
        (full_name, email, phone, id_proof, address),
    )
    db.commit()
    guest = db.execute("SELECT * FROM guests WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(guest)), 201


@hotel_bp.route("/guests/<int:guest_id>", methods=["PUT"])
def update_guest(guest_id):
    data = request.get_json(silent=True) or {}
    db = get_db()
    guest = db.execute("SELECT * FROM guests WHERE id = ?", (guest_id,)).fetchone()
    if not guest:
        return jsonify({"error": "Guest not found."}), 404

    full_name = (data.get("full_name") or guest["full_name"]).strip()
    if not full_name:
        return jsonify({"error": "Guest full name cannot be empty."}), 400

    email = (data.get("email") if data.get("email") is not None else guest["email"] or "").strip()
    phone = (data.get("phone") if data.get("phone") is not None else guest["phone"] or "").strip()
    id_proof = (data.get("id_proof") if data.get("id_proof") is not None else guest["id_proof"] or "").strip()
    address = (data.get("address") if data.get("address") is not None else guest["address"] or "").strip()

    db.execute(
        """UPDATE guests
           SET full_name = ?, email = ?, phone = ?, id_proof = ?, address = ?
           WHERE id = ?""",
        (full_name, email, phone, id_proof, address, guest_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM guests WHERE id = ?", (guest_id,)).fetchone()
    return jsonify(dict(updated))


# ---------------- BOOKINGS & CHECK-IN / CHECK-OUT ----------------

@hotel_bp.route("/bookings", methods=["GET"])
def list_bookings():
    db = get_db()
    rows = db.execute(
        """SELECT b.*, r.room_number, r.room_type, r.price_per_night,
                  g.full_name AS guest_name, g.phone AS guest_phone
           FROM bookings b
           JOIN rooms r ON b.room_id = r.id
           JOIN guests g ON b.guest_id = g.id
           ORDER BY b.id DESC"""
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@hotel_bp.route("/bookings", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or {}
    db = get_db()

    room_id = data.get("room_id")
    guest_id = data.get("guest_id")
    guest_name = (data.get("guest_name") or "").strip()
    guest_phone = (data.get("guest_phone") or "").strip()
    check_in_str = data.get("check_in_date")
    check_out_str = data.get("check_out_date")
    immediate_checkin = bool(data.get("check_in_now", False))
    notes = (data.get("notes") or "").strip()

    # Support quick-checkin modal sending nights instead of check_out_date
    if not check_in_str:
        check_in_str = date.today().isoformat()
    if not check_out_str and data.get("nights"):
        try:
            nights_val = int(data["nights"])
            if nights_val < 1:
                raise ValueError
            d_in = datetime.strptime(check_in_str, "%Y-%m-%d").date()
            check_out_str = (d_in + timedelta(days=nights_val)).isoformat()
        except ValueError:
            return jsonify({"error": "Nights must be at least 1."}), 400

    d_in, d_out, err = _parse_dates(check_in_str, check_out_str)
    if err:
        return jsonify({"error": err}), 400

    room = db.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
    if not room:
        return jsonify({"error": "Selected room not found."}), 404
    if room["status"] == "maintenance":
        return jsonify({"error": "Selected room is currently under maintenance."}), 409

    overlap = _has_overlapping_booking(db, room_id, check_in_str, check_out_str)
    if overlap:
        return jsonify({
            "error": (
                f"Room {room['room_number']} is already booked ({overlap['booking_ref']}: "
                f"{overlap['check_in_date']} to {overlap['check_out_date']})."
            )
        }), 409

    if immediate_checkin and room["status"] == "occupied":
        return jsonify({"error": f"Room {room['room_number']} is currently occupied."}), 409

    # Resolve or create guest
    if guest_id:
        guest = db.execute("SELECT * FROM guests WHERE id = ?", (guest_id,)).fetchone()
        if not guest:
            return jsonify({"error": "Selected guest not found."}), 404
    elif guest_name:
        cur_g = db.execute(
            "INSERT INTO guests (full_name, phone) VALUES (?, ?)", (guest_name, guest_phone)
        )
        guest_id = cur_g.lastrowid
    else:
        return jsonify({"error": "Please select an existing guest or enter a guest name."}), 400

    nights = (d_out - d_in).days
    total_amount = round(nights * float(room["price_per_night"]), 2)
    booking_status = "checked_in" if immediate_checkin else "confirmed"
    room_status = "occupied" if immediate_checkin else ("reserved" if room["status"] == "available" else room["status"])

    next_num = (db.execute("SELECT COALESCE(MAX(id), 0) FROM bookings").fetchone()[0]) + 1001
    booking_ref = f"BK-{next_num}"

    cur_b = db.execute(
        """INSERT INTO bookings
           (booking_ref, room_id, guest_id, check_in_date, check_out_date, nights, total_amount, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (booking_ref, room_id, guest_id, check_in_str, check_out_str, nights, total_amount, booking_status, notes),
    )
    booking_id = cur_b.lastrowid

    db.execute(
        "UPDATE rooms SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (room_status, room_id),
    )
    db.commit()

    created = db.execute(
        """SELECT b.*, r.room_number, r.room_type, g.full_name AS guest_name
           FROM bookings b
           JOIN rooms r ON b.room_id = r.id
           JOIN guests g ON b.guest_id = g.id
           WHERE b.id = ?""",
        (booking_id,),
    ).fetchone()
    return jsonify(dict(created)), 201


@hotel_bp.route("/bookings/<int:booking_id>/checkin", methods=["POST"])
def checkin_booking(booking_id):
    db = get_db()
    booking = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not booking:
        return jsonify({"error": "Booking not found."}), 404
    if booking["status"] != "confirmed":
        return jsonify({"error": f"Cannot check in booking with status '{booking['status']}'."}), 400

    db.execute("UPDATE bookings SET status = 'checked_in' WHERE id = ?", (booking_id,))
    db.execute(
        "UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (booking["room_id"],),
    )
    db.commit()
    return jsonify({"message": f"Booking {booking['booking_ref']} checked in."})


@hotel_bp.route("/bookings/<int:booking_id>/checkout", methods=["POST"])
def checkout_booking(booking_id):
    data = request.get_json(silent=True) or {}
    method = (data.get("method") or "card").strip().lower()
    if method not in {"cash", "card", "upi"}:
        method = "card"

    db = get_db()
    booking = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not booking:
        return jsonify({"error": "Booking not found."}), 404
    if booking["status"] != "checked_in":
        return jsonify({"error": "Only checked-in bookings can be checked out."}), 400

    db.execute("UPDATE bookings SET status = 'checked_out' WHERE id = ?", (booking_id,))
    db.execute(
        "UPDATE rooms SET status = 'cleaning', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (booking["room_id"],),
    )

    existing_payment = db.execute(
        "SELECT id FROM payments WHERE booking_id = ? AND status = 'completed'", (booking_id,)
    ).fetchone()
    if not existing_payment and booking["total_amount"] > 0:
        db.execute(
            """INSERT INTO payments
               (transaction_ref, booking_id, amount, method, payment_type, is_demo, status)
               VALUES (?, ?, ?, ?, 'room_booking', 1, 'completed')""",
            (f"DEMO-{booking['booking_ref']}", booking_id, booking["total_amount"], method),
        )

    db.commit()
    return jsonify({"message": f"Booking {booking['booking_ref']} checked out & room sent to housekeeping."})


@hotel_bp.route("/bookings/<int:booking_id>/cancel", methods=["POST"])
def cancel_booking(booking_id):
    db = get_db()
    booking = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not booking:
        return jsonify({"error": "Booking not found."}), 404
    if booking["status"] in ("checked_out", "cancelled"):
        return jsonify({"error": f"Booking is already {booking['status']}."}), 400

    db.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", (booking_id,))

    # Only mark room available if no other checked-in/confirmed booking currently holds it
    other_checked_in = db.execute(
        "SELECT id FROM bookings WHERE room_id = ? AND status = 'checked_in' AND id != ?",
        (booking["room_id"], booking_id),
    ).fetchone()
    if not other_checked_in:
        other_confirmed = db.execute(
            "SELECT id FROM bookings WHERE room_id = ? AND status = 'confirmed' AND id != ?",
            (booking["room_id"], booking_id),
        ).fetchone()
        new_room_status = "reserved" if other_confirmed else "available"
        db.execute(
            "UPDATE rooms SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_room_status, booking["room_id"]),
        )

    db.commit()
    return jsonify({"message": f"Booking {booking['booking_ref']} cancelled."})