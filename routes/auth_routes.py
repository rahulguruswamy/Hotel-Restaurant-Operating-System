from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash
from database import get_db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/me", methods=["GET"])
def current_user():
    user_id = session.get("user_id")
    db = get_db()
    if user_id:
        user = db.execute(
            "SELECT id, full_name, email, role FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        if user:
            return jsonify({"authenticated": True, "user": dict(user)})

    # Default shift display profile when not explicitly signed in
    default_user = db.execute(
        "SELECT id, full_name, email, role FROM users ORDER BY id ASC LIMIT 1"
    ).fetchone()
    return jsonify({
        "authenticated": False,
        "user": dict(default_user) if default_user else None,
    })


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    db = get_db()
    user = db.execute(
        "SELECT id, full_name, email, password_hash, role FROM users WHERE LOWER(email) = ?",
        (email,),
    ).fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    session["user_id"] = user["id"]
    return jsonify({
        "message": f"Signed in as {user['full_name']}",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
        },
    })


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Signed out successfully."})