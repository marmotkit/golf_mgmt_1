from flask import Blueprint

bp = Blueprint('api', __name__)
games_api = Blueprint('games_api', __name__)

# Import routes after blueprint creation
from app.api import members, tournaments, scores, dashboard, reports, games

# Register the games blueprint
bp.register_blueprint(games_api, url_prefix='/games')
