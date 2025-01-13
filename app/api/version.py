from flask import Blueprint, jsonify, request, current_app
from app import db
from app.models import Version
import traceback

bp = Blueprint('version', __name__)

@bp.route('/', methods=['GET'])
def get_version():
    try:
        # 使用原生 SQL 查詢
        result = db.session.execute('SELECT version FROM versions ORDER BY created_at DESC LIMIT 1')
        row = result.fetchone()
        
        if row:
            return jsonify({'version': row[0]})
        
        # 如果沒有版本記錄，使用原生 SQL 創建
        db.session.execute(
            'INSERT INTO versions (version, description, created_at, updated_at) VALUES (:version, :description, NOW(), NOW())',
            {'version': '1.0.0', 'description': '初始版本'}
        )
        db.session.commit()
        
        return jsonify({'version': '1.0.0'})
    except Exception as e:
        current_app.logger.error(f'Error getting version: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/description', methods=['GET'])
def get_version_description():
    try:
        # 使用原生 SQL 查詢
        result = db.session.execute('SELECT description FROM versions ORDER BY created_at DESC LIMIT 1')
        row = result.fetchone()
        
        if row:
            return jsonify({'description': row[0] or ''})
            
        # 如果沒有版本記錄，使用原生 SQL 創建
        db.session.execute(
            'INSERT INTO versions (version, description, created_at, updated_at) VALUES (:version, :description, NOW(), NOW())',
            {'version': '1.0.0', 'description': '初始版本'}
        )
        db.session.commit()
        
        return jsonify({'description': '初始版本'})
    except Exception as e:
        current_app.logger.error(f'Error getting version description: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
