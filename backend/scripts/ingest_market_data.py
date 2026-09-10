import os
import logging
import requests
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
load_dotenv()

from app import app
from extentions import db

from models.crop import Crop
from models.market import Market
from models.market_price import MarketPrice


API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

API_KEY = os.getenv("DATA_GOV_API_KEY")
logger = logging.getLogger(__name__)


def fetch_market_data(
    state=None,
    commodity=None,
    offset=0,
    limit=100
):
    if not API_KEY:
        raise RuntimeError(
            "DATA_GOV_API_KEY is not set. Add it to backend/.env before ingesting."
        )

    params = {
        "api-key": API_KEY,
        "format": "json",
        "offset": offset,
        "limit": limit
    }

    if state:
        params["filters[state]"] = state

    if commodity:
        params["filters[commodity]"] = commodity

    response = requests.get(
        API_URL,
        params=params,
        headers={
            "User-Agent": "Mozilla/5.0"
        },
        timeout=120
    )

    response.raise_for_status()

    data = response.json()
    if not isinstance(data, dict) or "records" not in data:
        raise RuntimeError(
            f"Government API returned no records payload: {data}"
        )

    return data


def fetch_all_market_data(
    state=None,
    commodity=None,
    batch_size=100
):

    all_records = []
    offset = 0

    while True:

        print(
            f"Fetching records "
            f"offset={offset}, "
            f"limit={batch_size}"
        )

        data = fetch_market_data(
            state=state,
            commodity=commodity,
            offset=offset,
            limit=batch_size
        )

        records = data.get("records", [])

        if not records:
            break

        all_records.extend(records)

        print(
            f"Received {len(records)} records"
        )

        if len(records) < batch_size:
            break

        offset += batch_size

    print(
        f"Total records fetched: {len(all_records)}"
    )

    return all_records


def get_or_create_crop(crop_name):
    crop = Crop.query.filter_by(
        name=crop_name
    ).first()

    if crop:
        return crop

    crop = Crop(
        name=crop_name
    )

    db.session.add(crop)
    db.session.flush()

    return crop


def get_or_create_market(state, district, market_name):
    market = Market.query.filter_by(
        name=market_name,
        state=state,
        district=district
    ).first()

    if market:
        return market

    market = Market(
        name=market_name,
        state=state,
        district=district
    )

    db.session.add(market)
    db.session.flush()

    return market


def parse_date(date_string):
    if not date_string:
        raise ValueError("arrival_date is required")
    for date_format in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_string, date_format).date()
        except ValueError:
            continue
    raise ValueError(f"Unsupported arrival_date: {date_string}")


def parse_price(value, field_name):
    if value is None or str(value).strip() == "":
        raise ValueError(f"{field_name} is required")
    try:
        parsed = float(str(value).replace(",", "").strip())
    except ValueError as error:
        raise ValueError(f"Invalid {field_name}: {value}") from error
    if parsed < 0:
        raise ValueError(f"{field_name} cannot be negative")
    return parsed


def save_record(record):
    state = (record.get("state") or "").strip()
    district = (record.get("district") or "").strip()
    market_name = (record.get("market") or "").strip()

    commodity = (record.get("commodity") or "").strip()
    variety = record.get("variety")
    grade = record.get("grade")

    if not all((state, district, market_name, commodity)):
        raise ValueError("state, district, market and commodity are required")
    arrival_date = parse_date(record.get("arrival_date"))

    min_price = parse_price(record.get("min_price"), "min_price")
    max_price = parse_price(record.get("max_price"), "max_price")
    modal_price = parse_price(record.get("modal_price"), "modal_price")

    # Get or create crop
    crop = get_or_create_crop(commodity)

    # Get or create market
    market = get_or_create_market(
        state,
        district,
        market_name
    )

    # Prevent duplicate records
    existing_price = MarketPrice.query.filter_by(
        market_id=market.id,
        crop_id=crop.id,
        variety=variety,
        grade=grade,
        arrival_date=arrival_date
    ).first()

    if existing_price:
        return False

    market_price = MarketPrice(
        market_id=market.id,
        crop_id=crop.id,
        variety=variety,
        grade=grade,
        arrival_date=arrival_date,
        min_price=min_price,
        max_price=max_price,
        modal_price=modal_price
    )

    db.session.add(market_price)

    return True


def ingest_data(
    state=None,
    commodity=None
):

    print("Fetching government market data...")

    records = fetch_all_market_data(
        state=state,
        commodity=commodity
    )

    print(
        f"Records received: {len(records)}"
    )

    inserted = 0
    skipped = 0

    for record in records:

        try:
            with db.session.begin_nested():
                was_inserted = save_record(record)

            if was_inserted:
                inserted += 1
            else:
                skipped += 1

        except Exception as e:

            logger.warning("Skipping malformed market record %r: %s", record, e)

    db.session.commit()

    print("--------------------------------")
    print("Ingestion completed")
    print(f"Inserted: {inserted}")
    print(f"Skipped: {skipped}")
    print("--------------------------------")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    with app.app_context():
        
        ingest_data(
            state="Maharashtra",
            commodity="Tomato"
        )