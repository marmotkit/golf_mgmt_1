from flask import Blueprint, jsonify, request, current_app
from app.models import Award, db, Tournament, Member
from datetime import datetime
import traceback

bp = Blueprint('awards', __name__)

@bp.route('/', methods=['GET'])
def get_awards():
    try:
        tournament_id = request.args.get('tournament_id')
        if not tournament_id:
            return jsonify({'error': '未提供賽事ID'}), 400
            
        awards = Award.query.filter_by(tournament_id=tournament_id).all()
        return jsonify([award.to_dict() for award in awards])
        
    except Exception as e:
        current_app.logger.error(f"獲取獎項時發生錯誤: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取獎項失敗',
            'details': str(e)
        }), 500

@bp.route('/', methods=['POST'])
def create_award():
    try:
        data = request.get_json()
        
        # 驗證必要欄位
        required_fields = ['tournament_id', 'award_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必要欄位: {field}'}), 400
        
        # 創建新獎項
        award = Award(
            tournament_id=data['tournament_id'],
            award_type=data['award_type'],
            category=data.get('category'),
            rank=data.get('rank'),
            member_id=data.get('member_id'),
            member_name=data.get('member_name'),
            score=data.get('score'),
            hole_number=data.get('hole_number'),
            description=data.get('description')
        )
        
        db.session.add(award)
        db.session.commit()
        
        return jsonify(award.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"創建獎項時發生錯誤: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '創建獎項失敗',
            'details': str(e)
        }), 500

@bp.route('/<int:id>', methods=['PUT'])
def update_award(id):
    try:
        award = Award.query.get_or_404(id)
        data = request.get_json()
        
        # 更新獎項資訊
        for key, value in data.items():
            if hasattr(award, key):
                setattr(award, key, value)
        
        db.session.commit()
        return jsonify(award.to_dict())
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新獎項時發生錯誤: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '更新獎項失敗',
            'details': str(e)
        }), 500

@bp.route('/<int:id>', methods=['DELETE'])
def delete_award(id):
    try:
        award = Award.query.get_or_404(id)
        db.session.delete(award)
        db.session.commit()
        return '', 204
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"刪除獎項時發生錯誤: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '刪除獎項失敗',
            'details': str(e)
        }), 500

@bp.route('/batch', methods=['POST'])
def batch_create_awards():
    try:
        data = request.get_json()
        
        if not isinstance(data, list):
            return jsonify({'error': '請求數據必須是陣列格式'}), 400
            
        created_awards = []
        for award_data in data:
            # 驗證必要欄位
            if 'tournament_id' not in award_data or 'award_type' not in award_data:
                continue
                
            award = Award(
                tournament_id=award_data['tournament_id'],
                award_type=award_data['award_type'],
                category=award_data.get('category'),
                rank=award_data.get('rank'),
                member_id=award_data.get('member_id'),
                member_name=award_data.get('member_name'),
                score=award_data.get('score'),
                hole_number=award_data.get('hole_number'),
                description=award_data.get('description')
            )
            
            db.session.add(award)
            created_awards.append(award)
            
        db.session.commit()
        return jsonify([award.to_dict() for award in created_awards]), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"批量創建獎項時發生錯誤: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '批量創建獎項失敗',
            'details': str(e)
        }), 500

@bp.route('/clear/<int:tournament_id>', methods=['POST'])
def clear_tournament_awards(tournament_id):
    try:
        Award.query.filter_by(tournament_id=tournament_id).delete()
        db.session.commit()
        return jsonify({'message': '成功清除該賽事所有獎項'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"清除賽事獎項時發生錯誤: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '清除賽事獎項失敗',
            'details': str(e)
        }), 500 