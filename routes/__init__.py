from .auth_routes import auth_bp
from .dashboard_routes import dashboard_bp
from .hotel_routes import hotel_bp
from .restaurant_routes import restaurant_bp
from .inventory_routes import inventory_bp
from .analytics_routes import analytics_bp


def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(hotel_bp)
    app.register_blueprint(restaurant_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(analytics_bp)