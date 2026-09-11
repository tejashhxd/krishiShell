from extentions import db


class CropListing(db.Model):
    __tablename__ = "crop_listings"

    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey("farmers.id"), nullable=False, index=True)
    crop_id = db.Column(db.Integer, db.ForeignKey("crops.id"), nullable=False)
    quantity_kg = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    expected_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)

    farmer = db.relationship("Farmer", backref=db.backref("crop_listings", lazy=True))
    crop = db.relationship("Crop")
