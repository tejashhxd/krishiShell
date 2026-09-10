from math import isfinite

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from extentions import db
from models.crop import Crop
from services.market_service import get_latest_prices_for_crop
from services.recommendation_engine import rank_markets


recommendation_bp = Blueprint("recommendation", __name__, url_prefix="/api")


def _number(payload, key):
    value = payload.get(key)
    if isinstance(value, bool):
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    return value if isfinite(value) else None


def _serialize(result):
    return {
        "market_id": result["market_id"],
        "market_name": result["market_name"],
        "distance_km": round(result["distance_km"], 2),
        "modal_price_per_quintal": result["modal_price_per_quintal"],
        "price_per_kg": round(result["price_per_kg"], 2),
        "transport_cost_per_kg": round(result["transport_cost_per_kg"], 2),
        "net_price_per_kg": round(result["net_price_per_kg"], 2),
        "estimated_net_realisation": round(
            result["estimated_net_realisation"], 2
        ),
        "arrival_date": result["arrival_date"],
    }


@recommendation_bp.post("/analyze")
def analyze():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    crop_id = payload.get("crop_id")
    crop_name = payload.get("crop_name")
    if isinstance(crop_id, bool):
        crop_id = None
    if crop_id is not None:
        try:
            crop_id = int(crop_id)
        except (TypeError, ValueError):
            crop_id = None

    if crop_id is None and isinstance(crop_name, str) and crop_name.strip():
        crop = Crop.query.filter(
            func.lower(Crop.name) == crop_name.strip().lower()
        ).first()
        crop_id = crop.id if crop else None

    quantity = _number(payload, "quantity_kg")
    latitude = _number(payload, "latitude")
    longitude = _number(payload, "longitude")

    if crop_id is None or quantity is None or quantity <= 0:
        return jsonify({
            "error": "crop_id or crop_name and a positive quantity_kg are required."
        }), 400
    if (
        latitude is None
        or longitude is None
        or not -90 <= latitude <= 90
        or not -180 <= longitude <= 180
    ):
        return jsonify({
            "error": "Valid latitude and longitude are required."
        }), 400

    crop = db.session.get(Crop, crop_id)
    if crop is None:
        return jsonify({"error": "Crop not found."}), 404

    prices = get_latest_prices_for_crop(crop_id)
    ranked = rank_markets(prices, latitude, longitude, quantity)
    profitable = [
        result for result in ranked
        if result["net_price_per_kg"] > 0
        and result["estimated_net_realisation"] > 0
    ]
    if not profitable:
        return jsonify({
            "crop": crop.name,
            "quantity_kg": quantity,
            "recommendation": None,
            "alternatives": [],
            "explanation": "No profitable markets found after transportation costs.",
            "trend": None,
        }), 200

    recommendation = profitable[0]
    explanation = (
        f'{recommendation["market_name"]} is recommended because it has the '
        "highest estimated net realisation after transportation costs."
    )
    if len(profitable) > 1 and (
        profitable[1]["modal_price_per_quintal"]
        > recommendation["modal_price_per_quintal"]
    ):
        explanation = (
            f'{recommendation["market_name"]} is recommended even though '
            "another market has a higher mandi price, because its estimated "
            "net realisation after transportation costs is higher."
        )

    return jsonify({
        "crop": crop.name,
        "quantity_kg": quantity,
        "recommendation": _serialize(recommendation),
        "alternatives": [_serialize(result) for result in profitable[1:]],
        "explanation": explanation,
        "trend": None,
    }), 200