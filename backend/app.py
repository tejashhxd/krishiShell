from flask import Flask, jsonify, request
from sqlalchemy import text
from flask_cors import CORS
from extentions import db
from models import (
    Farmer,
    Crop,
    Market,
    MarketPrice,
    Recommendation
)
from routes.market_routes import market_bp
from routes.recommendation_routes import recommendation_bp
from routes.auth_routes import auth_bp
from routes.listing_routes import listing_bp

from config import Config



def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.register_blueprint(market_bp)
    app.register_blueprint(recommendation_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(listing_bp)
    
    db.init_app(app)
    
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    
    @app.get("/api/health")
    def health():
        return jsonify({
            "message": "KrishiSell backend is running"
        }), 200
        
    # @app.route("/api/crops", methods=["GET"])
    # def crops():
    #     data = request.get_json()
    #     id = data.id
        
    #     crop = Crop.query.filter_by(
    #         id=id
    #     ).first()
        
    #     if not crop:
    #         return jsonify("error": "crop not found")
        
    with app.app_context():
        db.create_all()
        if db.engine.dialect.name == "postgresql":
            db.session.execute(text("ALTER TABLE farmers ALTER COLUMN password TYPE VARCHAR(255)"))
            db.session.execute(text("ALTER TABLE crop_listings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION"))
            db.session.execute(text("ALTER TABLE crop_listings ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION"))
            db.session.commit()
        
    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)