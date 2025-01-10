from flask import jsonify, request, current_app
from app.api import bp
from app.models import Tournament, db
import logging
import traceback
import json
from datetime import datetime

# 使用當前應用的日誌記錄器
logger = current_app.logger if current_app else logging.getLogger(__name__)

@bp.route('/tournaments', methods=['GET'])
def get_tournaments():
    tournaments = Tournament.query.all()
    return jsonify([t.to_dict() for t in tournaments])

@bp.route('/tournaments/<int:id>', methods=['GET'])
def get_tournament(id):
    tournament = Tournament.query.get_or_404(id)
    return jsonify(tournament.to_dict())

@bp.route('/tournaments', methods=['POST'])
def create_tournament():
    try:
        # 获取 JSON 数据
        data = request.get_json()
        current_app.logger.info(f"[1] Received tournament data: {json.dumps(data, ensure_ascii=False)}")
        
        # 验证必要字段
        required_fields = ['name', 'date', 'location']
        for field in required_fields:
            if field not in data:
                error_msg = f'Missing required field: {field}'
                current_app.logger.error(error_msg)
                return jsonify({'error': error_msg}), 400
            if not data[field]:
                error_msg = f'Field cannot be empty: {field}'
                current_app.logger.error(error_msg)
                return jsonify({'error': error_msg}), 400
        
        try:
            # 创建新赛事
            tournament = Tournament()
            current_app.logger.info("[2] Tournament object initialized")
            
            # 记录每个字段的值
            current_app.logger.info(f"[3] Processing fields:")
            current_app.logger.info(f"Name: {data.get('name')}")
            current_app.logger.info(f"Date: {data.get('date')}")
            current_app.logger.info(f"Location: {data.get('location')}")
            current_app.logger.info(f"Notes: {data.get('notes')}")
            
            try:
                tournament.from_dict(data)
                current_app.logger.info("[4] Tournament object populated with data")
            except Exception as e:
                current_app.logger.error(f"[ERROR] Error in from_dict: {str(e)}")
                current_app.logger.error(traceback.format_exc())
                raise
            
            try:
                # 记录对象的状态
                current_app.logger.info(f"[5] Tournament object state before save: {tournament.to_dict()}")
                
                db.session.add(tournament)
                current_app.logger.info("[6] Tournament added to session")
                
                db.session.commit()
                current_app.logger.info("[7] Transaction committed successfully")
                
                result = tournament.to_dict()
                current_app.logger.info(f"[8] Returning result: {json.dumps(result, ensure_ascii=False)}")
                return jsonify(result), 201
            except Exception as e:
                current_app.logger.error(f"[ERROR] Database error: {str(e)}")
                current_app.logger.error(traceback.format_exc())
                raise
            
        except ValueError as e:
            error_msg = f'Invalid data format: {str(e)}'
            current_app.logger.error(f"[ERROR] ValueError: {error_msg}")
            return jsonify({
                'error': 'Invalid data format',
                'details': str(e)
            }), 400
            
    except Exception as e:
        db.session.rollback()
        error_msg = f"Error creating tournament: {str(e)}"
        current_app.logger.error(f"[ERROR] Unhandled exception: {error_msg}")
        current_app.logger.error(traceback.format_exc())
        
        # 返回详细的错误信息
        return jsonify({
            'error': 'Failed to create tournament',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

@bp.route('/tournaments/<int:id>', methods=['PUT'])
def update_tournament(id):
    try:
        tournament = Tournament.query.get_or_404(id)
        data = request.get_json()
        
        # 修改數據映射，確保正確的鍵名
        tournament_data = {
            'name': data.get('name', tournament.name),
            'date': datetime.strptime(data.get('date', tournament.date.strftime('%Y-%m-%d')), '%Y-%m-%d').date(),
            'location': data.get('location', tournament.location),
            'notes': data.get('notes', tournament.notes)
        }
        
        tournament.from_dict(tournament_data)
        db.session.commit()
        return jsonify(tournament.to_dict())
    except Exception as e:
        logger.error(f"Error updating tournament: {str(e)}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'error': 'Failed to update tournament',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

@bp.route('/tournaments/<int:id>', methods=['DELETE'])
def delete_tournament(id):
    try:
        tournament = Tournament.query.get_or_404(id)
        db.session.delete(tournament)
        db.session.commit()
        return '', 204
    except Exception as e:
        logger.error(f"Error deleting tournament: {str(e)}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'error': 'Failed to delete tournament',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500
