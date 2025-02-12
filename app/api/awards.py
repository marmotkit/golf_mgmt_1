from flask import Blueprint, jsonify, request, current_app
from app.models import db, TournamentAward, AwardType
import logging
import traceback

bp = Blueprint('awards', __name__)
logger = logging.getLogger(__name__)

@bp.route('/types', methods=['GET'])
def get_award_types():
    """獲取所有獎項類型"""
    try:
        logger.info('開始獲取獎項類型')
        award_types = AwardType.query.filter_by(is_active=True).all()
        
        # 如果沒有獎項類型，自動初始化
        if not award_types:
            logger.info('獎項類型為空，開始初始化')
            default_types = [
                {
                    'name': '總桿冠軍',
                    'description': '總桿數最少者',
                    'has_score': True,
                    'has_rank': True,
                    'max_winners': 1,
                    'is_active': True
                },
                {
                    'name': '淨桿冠軍',
                    'description': '淨桿數最少者',
                    'has_score': True,
                    'has_rank': True,
                    'max_winners': 1,
                    'is_active': True
                },
                {
                    'name': '淨桿亞軍',
                    'description': '淨桿數第二少者',
                    'has_score': True,
                    'has_rank': True,
                    'max_winners': 1,
                    'is_active': True
                },
                {
                    'name': '淨桿季軍',
                    'description': '淨桿數第三少者',
                    'has_score': True,
                    'has_rank': True,
                    'max_winners': 1,
                    'is_active': True
                },
                {
                    'name': '一桿進洞',
                    'description': '一桿進洞者',
                    'has_hole_number': True,
                    'max_winners': None,
                    'is_active': True
                },
                {
                    'name': '最近洞獎',
                    'description': '最接近洞口者',
                    'has_hole_number': True,
                    'max_winners': None,
                    'is_active': True
                },
                {
                    'name': '最遠洞獎',
                    'description': '最遠距離進洞者',
                    'has_hole_number': True,
                    'max_winners': None,
                    'is_active': True
                }
            ]
            
            for type_data in default_types:
                award_type = AwardType(**type_data)
                db.session.add(award_type)
            
            try:
                db.session.commit()
                logger.info('成功初始化獎項類型')
                award_types = AwardType.query.filter_by(is_active=True).all()
            except Exception as e:
                db.session.rollback()
                logger.error(f'初始化獎項類型時發生錯誤: {str(e)}')
                raise
        
        logger.info(f'找到 {len(award_types)} 個獎項類型')
        return jsonify([t.to_dict() for t in award_types])
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
        tournament_id = request.args.get('tournament_id', type=int)
        if not tournament_id:
            return jsonify({'error': '必須提供賽事ID'}), 400
            
        logger.info(f'獲取賽事 {tournament_id} 的獎項')
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