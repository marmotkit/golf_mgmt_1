from flask import Blueprint, jsonify, request, current_app
from app.models import db, TournamentAward, AwardType
import logging
import traceback

bp = Blueprint('awards', __name__, url_prefix='/api/awards')
logger = logging.getLogger(__name__)

@bp.before_request
def log_request_info():
    """記錄每個請求的詳細信息"""
    logger.info('====== 獎項管理 API 請求開始 ======')
    logger.info(f'請求方法: {request.method}')
    logger.info(f'請求路徑: {request.path}')
    logger.info(f'請求參數: {dict(request.args)}')
    logger.info(f'請求頭: {dict(request.headers)}')
    if request.is_json:
        logger.info(f'請求數據: {request.get_json()}')
    logger.info('================================')

@bp.route('/types', methods=['GET'])
def get_award_types():
    """獲取所有獎項類型"""
    try:
        logger.info('開始獲取獎項類型')
        award_types = AwardType.query.filter_by(is_active=True).all()
        
        # 如果沒有獎項類型，自動初始化
        if not award_types:
            logger.info('獎項類型為空，開始初始化')
            from init_award_types import init_award_types
            init_award_types()
            award_types = AwardType.query.filter_by(is_active=True).all()
            
        logger.info(f'找到 {len(award_types)} 個獎項類型')
        result = [t.to_dict() for t in award_types]
        logger.info(f'返回數據: {result}')
        return jsonify(result)
    except Exception as e:
        logger.error(f"獲取獎項類型時發生錯誤: {str(e)}")
        logger.error(f"錯誤類型: {type(e).__name__}")
        logger.error(f"完整錯誤信息: {traceback.format_exc()}")
        return jsonify({
            'error': '獲取獎項類型失敗',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

@bp.route('/types', methods=['POST'])
def create_award_type():
    """創建新的獎項類型"""
    try:
        data = request.get_json()
        award_type = AwardType(**data)
        db.session.add(award_type)
        db.session.commit()
        return jsonify(award_type.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"創建獎項類型時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/types/<int:id>', methods=['PUT'])
def update_award_type(id):
    """更新獎項類型"""
    try:
        award_type = AwardType.query.get_or_404(id)
        data = request.get_json()
        for key, value in data.items():
            setattr(award_type, key, value)
        db.session.commit()
        return jsonify(award_type.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"更新獎項類型時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/', methods=['GET'])
def get_tournament_awards():
    """獲取賽事獎項"""
    try:
        logger.info('開始獲取賽事獎項')
        tournament_id = request.args.get('tournament_id', type=int)
        logger.info(f'賽事ID: {tournament_id}')
        
        if not tournament_id:
            logger.error('未提供賽事ID')
            return jsonify({'error': '必須提供賽事ID'}), 400
            
        logger.info(f'查詢賽事 {tournament_id} 的獎項')
        awards = TournamentAward.query.filter_by(tournament_id=tournament_id).all()
        logger.info(f'找到 {len(awards)} 個獎項')
        
        result = []
        for award in awards:
            try:
                award_dict = award.to_dict()
                result.append(award_dict)
            except Exception as e:
                logger.error(f'轉換獎項 {award.id} 為字典時發生錯誤: {str(e)}')
                logger.error(traceback.format_exc())
                continue
        
        logger.info(f'返回數據: {result}')
        return jsonify(result)
    except Exception as e:
        logger.error(f"獲取賽事獎項時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取賽事獎項失敗',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

@bp.route('/', methods=['POST'])
def create_tournament_award():
    """創建賽事獎項"""
    try:
        data = request.get_json()
        award = TournamentAward(**data)
        db.session.add(award)
        db.session.commit()
        return jsonify(award.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"創建賽事獎項時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
def update_tournament_award(id):
    """更新賽事獎項"""
    try:
        award = TournamentAward.query.get_or_404(id)
        data = request.get_json()
        for key, value in data.items():
            setattr(award, key, value)
        db.session.commit()
        return jsonify(award.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"更新賽事獎項時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
def delete_tournament_award(id):
    """刪除賽事獎項"""
    try:
        award = TournamentAward.query.get_or_404(id)
        db.session.delete(award)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        logger.error(f"刪除賽事獎項時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/batch', methods=['POST'])
def batch_create_awards():
    """批量創建賽事獎項"""
    try:
        data = request.get_json()
        awards = []
        for award_data in data:
            award = TournamentAward(**award_data)
            db.session.add(award)
            awards.append(award)
        db.session.commit()
        return jsonify([a.to_dict() for a in awards]), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"批量創建賽事獎項時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500 