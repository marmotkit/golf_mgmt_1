from flask import Blueprint

bp = Blueprint('api', __name__)

# Import routes
from app.api import members, tournaments, scores, dashboard, reports, games
