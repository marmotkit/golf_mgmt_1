from flask import Blueprint, jsonify, request, current_app
from app import db
from app.models import Version
import traceback
from datetime import datetime

bp = Blueprint('version', __name__)

def ensure_version_exists():
    """確保至少存在一個版本記錄"""
    try:
        # 檢查是否有任何版本記錄
        version_count = Version.query.count()
        if version_count == 0:
            # 創建初始版本
            initial_version = Version(
                version='1.0.0',
                description='初始版本',
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(initial_version)
            db.session.commit()
            current_app.logger.info('Created initial version')
            return initial_version
        return None
    except Exception as e:
        current_app.logger.error(f'Error in ensure_version_exists: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return None

@bp.route('/', methods=['GET'])
def get_version():
    try:
        # 確保存在版本記錄
        ensure_version_exists()
        
        # 獲取最新版本
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
        # 確保存在版本記錄
        ensure_version_exists()
        
        # 獲取最新版本
        latest_version = Version.query.order_by(Version.created_at.desc()).first()
        if latest_version:
            return jsonify({'description': latest_version.description or ''})
        
        return jsonify({'description': '初始版本'})
    except Exception as e:
        current_app.logger.error(f'Error getting version description: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
