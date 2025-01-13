from flask import Blueprint, jsonify, request, current_app
from app import db
from app.models import Version
import traceback

bp = Blueprint('version', __name__)

@bp.route('/', methods=['GET'])
def get_version():
    try:
        latest_version = Version.query.order_by(Version.created_at.desc()).first()
        if latest_version:
            return jsonify({'version': latest_version.version})
        return jsonify({'version': '1.0.0'})
    except Exception as e:
        current_app.logger.error(f'Error getting version: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/description', methods=['GET'])
def get_version_description():
    try:
        latest_version = Version.query.order_by(Version.created_at.desc()).first()
        if latest_version:
            return jsonify({'description': latest_version.description or ''})
        return jsonify({'description': '初始版本'})
    except Exception as e:
        current_app.logger.error(f'Error getting version description: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
