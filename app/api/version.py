from flask import Blueprint, jsonify, request, current_app
from app import db
from app.models import Version
import traceback
from sqlalchemy import text

bp = Blueprint('version', __name__)

@bp.route('/', methods=['GET'])
def get_version():
    try:
        # 使用 text() 包裝 SQL 查詢
        sql = text('SELECT version FROM versions ORDER BY created_at DESC LIMIT 1')
        result = db.session.execute(sql)
        row = result.fetchone()
        
        if row:
            return jsonify({'version': row[0]})
        
        # 如果沒有版本記錄，使用參數化查詢創建
        sql = text('INSERT INTO versions (version, description, created_at, updated_at) VALUES (:version, :description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        db.session.execute(sql, {
            'version': '1.0.0',
            'description': '初始版本'
        })
        db.session.commit()
        
        return jsonify({'version': '1.0.0'})
    except Exception as e:
        current_app.logger.error(f'Error getting version: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/description', methods=['GET'])
def get_version_description():
    try:
        # 使用 text() 包裝 SQL 查詢
        sql = text('SELECT description FROM versions ORDER BY created_at DESC LIMIT 1')
        result = db.session.execute(sql)
        row = result.fetchone()
        
        if row:
            return jsonify({'description': row[0] or ''})
            
        # 如果沒有版本記錄，使用參數化查詢創建
        sql = text('INSERT INTO versions (version, description, created_at, updated_at) VALUES (:version, :description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        db.session.execute(sql, {
            'version': '1.0.0',
            'description': '初始版本'
        })
        db.session.commit()
        
        return jsonify({'description': '初始版本'})
    except Exception as e:
        current_app.logger.error(f'Error getting version description: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
