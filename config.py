import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Uses environment variable in production; safe random fallback for local/demo run
    SECRET_KEY = os.environ.get("SECRET_KEY") or os.urandom(24)
    INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
    DATABASE_PATH = os.environ.get("DATABASE_PATH") or os.path.join(INSTANCE_DIR, "hotel.db")
    TAX_AND_SERVICE_RATE = 0.18  # 8% Tax + 10% Service Charge
    VIP_DISCOUNT_RATE = 0.10     # 10% VIP Discount