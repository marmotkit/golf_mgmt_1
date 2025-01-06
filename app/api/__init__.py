from flask import Blueprint

bp = Blueprint('api', __name__)

# Import routes after creating blueprint to avoid circular imports
from app.api.members import *  # noqa
from app.api.tournaments import *  # noqa
from app.api.scores import *  # noqa
from app.api.reports import *  # noqa
