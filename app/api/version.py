from flask import Blueprint, jsonify, request, current_app
from app import db
from app.models import Version
import traceback
from datetime import datetime
import logging
from sqlalchemy import text, desc

# 配置日誌
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

bp = Blueprint('version', __name__)

def ensure_version_exists():
    """確保至少存在一個版本記錄"""
    try:
        logger.info('Checking if version exists...')
        
        # 檢查是否有任何版本記錄
        version_count = db.session.query(Version).count()
        logger.info(f'Found {version_count} versions')
        
        if version_count == 0:
            logger.info('No version found, creating initial version...')
            
            # 創建初始版本
            initial_version = Version(
                version='1.0.0',
                description='初始版本',
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            try:
                db.session.add(initial_version)
                db.session.commit()
                logger.info('Created initial version successfully')
                return initial_version
            except Exception as e:
                logger.error(f'Error creating initial version: {str(e)}')
                logger.error(traceback.format_exc())
                db.session.rollback()
                raise
        
        logger.info('Version exists')
        return None
    except Exception as e:
        logger.error(f'Error in ensure_version_exists: {str(e)}')
        logger.error(traceback.format_exc())
        db.session.rollback()
        raise

@bp.route('/', methods=['GET'])
def get_version():
    try:
        logger.info('GET /version/ called')
        
        # 確保存在版本記錄
        try:
            ensure_version_exists()
        except Exception as e:
            logger.error(f'Error in ensure_version_exists: {str(e)}')
            return jsonify({'error': 'Failed to ensure version exists', 'details': str(e)}), 500
        
        # 獲取最新版本
        try:
            latest_version = db.session.query(Version).order_by(desc(Version.created_at)).first()
            logger.info(f'Latest version: {latest_version.version if latest_version else None}')
            
            if latest_version:
                return jsonify({'version': latest_version.version})
            
            return jsonify({'version': '1.0.0'})
        except Exception as e:
            logger.error(f'Error getting latest version: {str(e)}')
            db.session.rollback()
            return jsonify({'error': 'Failed to get latest version', 'details': str(e)}), 500
            
    except Exception as e:
        logger.error(f'Unexpected error in get_version: {str(e)}')
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/description', methods=['GET'])
def get_version_description():
    try:
        logger.info('GET /version/description called')
        
        # 確保存在版本記錄
        try:
            ensure_version_exists()
        except Exception as e:
            logger.error(f'Error in ensure_version_exists: {str(e)}')
            return jsonify({'error': 'Failed to ensure version exists', 'details': str(e)}), 500
        
        # 獲取最新版本
        try:
            latest_version = db.session.query(Version).order_by(desc(Version.created_at)).first()
            logger.info(f'Latest version description: {latest_version.description if latest_version else None}')
            
            if latest_version:
                return jsonify({'description': latest_version.description or ''})
            
            return jsonify({'description': '初始版本'})
        except Exception as e:
            logger.error(f'Error getting latest version description: {str(e)}')
            db.session.rollback()
            return jsonify({'error': 'Failed to get latest version description', 'details': str(e)}), 500
            
    except Exception as e:
        logger.error(f'Unexpected error in get_version_description: {str(e)}')
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
