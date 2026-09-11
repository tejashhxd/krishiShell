from datetime import date

from flask import Blueprint, jsonify, request

from extentions import db
from models.crop import Crop
from models.crop_listing import CropListing


listing_bp = Blueprint("listings", __name__, url_prefix="/api/listings")


def _farmer_id(data):
    try:
        farmer_id = int(data.get("farmer_id"))
    except (TypeError, ValueError):
        return None
    return farmer_id if farmer_id > 0 else None


def _serialize(listing):
    return {
        "id": listing.id,
        "crop_id": listing.crop_id,
        "name": listing.crop.name,
        "quantity": listing.quantity_kg,
        "location": listing.location,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "date": listing.expected_date.isoformat(),
    }


@listing_bp.get("")
def get_listings():
    farmer_id = _farmer_id(request.args)
    if farmer_id is None:
        return jsonify({"error": "A valid farmer_id is required."}), 400

    listings = CropListing.query.filter_by(farmer_id=farmer_id).order_by(
        CropListing.created_at.desc()
    ).all()
    return jsonify({"success": True, "data": [_serialize(item) for item in listings]}), 200


@listing_bp.post("")
def create_listing():
    data = request.get_json(silent=True) or {}
    farmer_id = _farmer_id(data)
    try:
        crop_id = int(data.get("crop_id"))
        quantity = float(data.get("quantity_kg"))
        expected_date = date.fromisoformat(str(data.get("date")))
    except (TypeError, ValueError):
        return jsonify({"error": "Valid farmer, crop, quantity, and date are required."}), 400

    location = str(data.get("location", "")).strip()
    try:
        latitude = float(data.get("latitude"))
        longitude = float(data.get("longitude"))
    except (TypeError, ValueError):
        latitude = longitude = None
    if (
        farmer_id is None
        or quantity <= 0
        or not location
        or latitude is None
        or longitude is None
        or not -90 <= latitude <= 90
        or not -180 <= longitude <= 180
    ):
        return jsonify({"error": "Valid farmer, crop, quantity, and location are required."}), 400
    if not Crop.query.get(crop_id):
        return jsonify({"error": "Crop not found."}), 404

    listing = CropListing(
        farmer_id=farmer_id,
        crop_id=crop_id,
        quantity_kg=quantity,
        location=location,
        latitude=latitude,
        longitude=longitude,
        expected_date=expected_date,
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify({"success": True, "data": _serialize(listing)}), 201


@listing_bp.get("/<int:listing_id>")
def get_listing(listing_id):
    farmer_id = _farmer_id(request.args)
    listing = CropListing.query.filter_by(id=listing_id, farmer_id=farmer_id).first()
    if listing is None:
        return jsonify({"error": "Listing not found."}), 404
    return jsonify({"success": True, "data": _serialize(listing)}), 200


@listing_bp.delete("/<int:listing_id>")
def delete_listing(listing_id):
    data = request.get_json(silent=True) or {}
    farmer_id = _farmer_id(data)
    listing = CropListing.query.filter_by(id=listing_id, farmer_id=farmer_id).first()
    if listing is None:
        return jsonify({"error": "Listing not found."}), 404

    db.session.delete(listing)
    db.session.commit()
    return jsonify({"success": True}), 200
