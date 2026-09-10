import requests
from flask import Blueprint, jsonify, request
from extentions import db
from models.crop import Crop
from models.market import Market

market_bp = Blueprint("market", __name__, url_prefix="/api")


@market_bp.get("/geocode")
def geocode_location():
    location = request.args.get("location", "").strip()
    if not location:
        return jsonify({"error": "A location is required."}), 400

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": f"{location}, Maharashtra, India",
                "format": "json",
                "limit": 1,
                "countrycodes": "in",
            },
            headers={"User-Agent": "KrishiSell/1.0"},
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException:
        return jsonify({"error": "Unable to resolve the entered location."}), 502

    results = response.json()
    if not results:
        return jsonify({"error": f"Location not found: {location}"}), 404

    return jsonify({
        "success": True,
        "data": {
            "latitude": float(results[0]["lat"]),
            "longitude": float(results[0]["lon"]),
            "display_name": results[0].get("display_name"),
        },
    }), 200

@market_bp.route("/crops", methods=["GET"])
def get_crops():
    crops = Crop.query.order_by(Crop.name).all()
    
    return jsonify({
        "success": True,
        "data": [
            {
                "id": crop.id,
                "name": crop.name
            }
            for crop in crops
        ]
    }), 200
    
    
@market_bp.route("/markets", methods=["GET"])
def get_market():
    markets = Market.query.order_by(Market.name).all()
    
    return jsonify({
        "success": True,
        "data": [
            {
                "id": market.id,
                "name": market.name,
                "state": market.state,
                "district": market.district,
                "latitude": market.latitude,
                "longitude": market.longitude
            }
            for market in markets
        ]
    }), 200
    
    
@market_bp.route("/markets/<int:market_id>/prices", methods=["GET"])
def get_market_prices(market_id):
    from models.market import Market
    from models.market_price import MarketPrice

    market = db.session.get(Market, market_id)

    if not market:
        return jsonify({
            "success": False,
            "message": "Market not found"
        }), 404

    prices = MarketPrice.query.filter_by(
        market_id=market_id
    ).order_by(
        MarketPrice.arrival_date.desc()
    ).all()

    return jsonify({
        "success": True,
        "data": [
            {
                "crop": price.crop.name,
                "variety": price.variety,
                "grade": price.grade,
                "date": price.arrival_date.isoformat(),
                "min_price": price.min_price,
                "max_price": price.max_price,
                "modal_price": price.modal_price
            }
            for price in prices
            if price.crop is not None
        ]
    })