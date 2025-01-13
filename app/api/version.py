from flask import Blueprint, jsonify, request
from app import db
from app.models import Version

bp = Blueprint('version', __name__)

@bp.route('/version', methods=['GET'])
def get_version():
    latest_version = Version.query.order_by(Version.created_at.desc()).first()
    if latest_version:
        return jsonify({'version': latest_version.version})
    return jsonify({'version': '1.0.0'})

@bp.route('/version/description', methods=['GET'])
def get_version_description():
    latest_version = Version.query.order_by(Version.created_at.desc()).first()
    if latest_version:
        return jsonify({'description': latest_version.description or ''})
    return jsonify({'description': '初始版本'})
