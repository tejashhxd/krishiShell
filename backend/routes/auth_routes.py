from flask import Blueprint, jsonify, request
from flask_bcrypt import Bcrypt

from extentions import db
from models.farmer import Farmer


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
bcrypt = Bcrypt()


def _credentials():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    password = str(data.get("password", ""))
    if not name or not phone or len(password) < 8:
        return None
    return name, phone, password


@auth_bp.post("/register")
def register():
    credentials = _credentials()
    if credentials is None:
        return jsonify({"error": "Name, phone, and a password of at least 8 characters are required."}), 400

    name, phone, password = credentials
    if Farmer.query.filter_by(phone=phone).first():
        return jsonify({"error": "An account already exists for this phone number."}), 409

    farmer = Farmer(
        name=name,
        phone=phone,
        password=bcrypt.generate_password_hash(password).decode("utf-8"),
    )
    db.session.add(farmer)
    db.session.commit()

    return jsonify({"success": True, "user": {"id": farmer.id, "name": farmer.name, "phone": farmer.phone, "role": "farmer"}}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    phone = str(data.get("phone", "")).strip()
    password = str(data.get("password", ""))
    if not phone or not password:
        return jsonify({"error": "Phone and password are required."}), 400

    farmer = Farmer.query.filter_by(phone=phone).first()
    if not farmer or not bcrypt.check_password_hash(farmer.password, password):
        return jsonify({"error": "Invalid phone number or password."}), 401

    return jsonify({"success": True, "user": {"id": farmer.id, "name": farmer.name, "phone": farmer.phone, "role": "farmer"}}), 200
