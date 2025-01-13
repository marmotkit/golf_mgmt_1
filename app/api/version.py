from flask import Blueprint, jsonify, request, current_app
from app import db
from app.models import Version
import traceback

bp = Blueprint('version', __name__)

@bp.route('/', methods=['GET'])
def get_version():
    try:
        # 確保使用正確的表名
        latest_version = db.session.query(Version)\
            .order_by(Version.created_at.desc())\
            .first()
        
        if latest_version:
            return jsonify({'version': latest_version.version})
        
        # 如果沒有版本記錄，創建一個初始版本
        initial_version = Version(
            version='1.0.0',
            description='初始版本'
        )
        db.session.add(initial_version)
        db.session.commit()
        
        return jsonify({'version': initial_version.version})
    except Exception as e:
        current_app.logger.error(f'Error getting version: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/description', methods=['GET'])
def get_version_description():
    try:
        # 確保使用正確的表名
        latest_version = db.session.query(Version)\
            .order_by(Version.created_at.desc())\
            .first()
        
        if latest_version:
            return jsonify({'description': latest_version.description or ''})
            
        # 如果沒有版本記錄，創建一個初始版本
        initial_version = Version(
            version='1.0.0',
            description='初始版本'
        )
        db.session.add(initial_version)
        db.session.commit()
        
        return jsonify({'description': initial_version.description})
    except Exception as e:
        current_app.logger.error(f'Error getting version description: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
