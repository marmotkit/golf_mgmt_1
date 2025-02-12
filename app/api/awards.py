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
        award_types = AwardType.query.filter_by(is_active=True).all()
        return jsonify([t.to_dict() for t in award_types])
    except Exception as e:
        logger.error(f"獲取獎項類型時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

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
            
        awards = TournamentAward.query.filter_by(tournament_id=tournament_id).all()
        return jsonify([a.to_dict() for a in awards])
    except Exception as e:
        logger.error(f"獲取賽事獎項時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

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