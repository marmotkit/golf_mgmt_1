from flask import Blueprint, jsonify, request, current_app
from app.models import Tournament, db
import logging
import traceback
import json
from datetime import datetime

bp = Blueprint('tournaments', __name__)

# 使用當前應用的日誌記錄器
logger = current_app.logger if current_app else logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
def get_tournaments():
    try:
        tournaments = Tournament.query.all()
        return jsonify([t.to_dict() for t in tournaments])
    except Exception as e:
        logger.error(f"獲取賽事列表時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取賽事列表失敗',
            'details': str(e)
        }), 500

@bp.route('/<int:id>', methods=['GET'])
def get_tournament(id):
    try:
        tournament = Tournament.query.get_or_404(id)
        return jsonify(tournament.to_dict())
    except Exception as e:
        logger.error(f"獲取賽事 {id} 時發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': f'獲取賽事 {id} 失敗',
            'details': str(e)
        }), 500

@bp.route('/', methods=['POST'])
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

@bp.route('/<int:id>', methods=['PUT'])
def update_tournament(id):
    try:
        tournament = Tournament.query.get_or_404(id)
        data = request.get_json()
        current_app.logger.info(f"Updating tournament {id} with data: {data}")
        
        # 檢查必要字段
        if not all(key in data for key in ['name', 'location', 'date']):
            return jsonify({
                'error': 'Missing required fields',
                'details': 'name, location, and date are required'
            }), 400

        try:
            # 處理日期
            if isinstance(data['date'], str):
                date_str = data['date'].split('T')[0]  # 處理可能的時間部分
                tournament_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            else:
                return jsonify({
                    'error': 'Invalid date format',
                    'details': 'date must be a string in YYYY-MM-DD format'
                }), 400

            # 更新數據
            tournament.name = data['name']
            tournament.location = data['location']
            tournament.date = tournament_date
            tournament.notes = data.get('notes', '')

            db.session.commit()
            
            result = tournament.to_dict()
            current_app.logger.info(f"Updated tournament result: {result}")
            return jsonify(result)
            
        except ValueError as e:
            return jsonify({
                'error': 'Invalid date format',
                'details': str(e)
            }), 400
            
    except Exception as e:
        current_app.logger.error(f"Error updating tournament: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'error': 'Failed to update tournament',
            'details': str(e)
        }), 500

@bp.route('/<int:id>', methods=['DELETE'])
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
