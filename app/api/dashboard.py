from flask import Blueprint, jsonify, current_app, request
from app.models import Member, Tournament, YearlyChampion, db
from datetime import datetime
from sqlalchemy import func
import traceback
from app.api import bp

@bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        current_app.logger.info("開始獲取儀表板統計數據")
        
        # 獲取會員數量（只計算非來賓的會員）
        member_count = Member.query.filter_by(is_guest=False).count()
        current_app.logger.info(f"會員數量: {member_count}")

        # 獲取本年度的賽事
        current_year = datetime.now().year
        tournaments = Tournament.query.filter(
            func.extract('year', Tournament.date) == current_year
        ).order_by(Tournament.date.desc()).all()

        # 計算本年度賽事總數
        tournament_count = len(tournaments)
        current_app.logger.info(f"本年度賽事數量: {tournament_count}")
        
        # 獲取最新賽事名稱
        latest_tournament_name = tournaments[0].name if tournaments else ""
        current_app.logger.info(f"最新賽事名稱: {latest_tournament_name}")

        # 獲取最新的年度總桿冠軍榜數據
        champions = YearlyChampion.query.order_by(YearlyChampion.date.desc()).limit(5).all()
        champions_data = [c.to_dict() for c in champions]
        current_app.logger.info(f"年度總桿冠軍榜數據: {champions_data}")

        response_data = {
            'member_count': member_count,
            'tournament_count': tournament_count,
            'latest_tournament_name': latest_tournament_name,
            'champions': champions_data
        }
        current_app.logger.info(f"返回數據: {response_data}")
        
        return jsonify(response_data)

    except Exception as e:
        current_app.logger.error(f"獲取儀表板統計數據時發生錯誤: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取儀表板統計數據失敗',
            'details': str(e)
        }), 500

@bp.route('/dashboard/champions', methods=['GET'])
def get_champions():
    try:
        champions = YearlyChampion.query.order_by(YearlyChampion.date.desc()).all()
        return jsonify([c.to_dict() for c in champions])
    except Exception as e:
        current_app.logger.error(f"獲取年度總桿冠軍榜失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取年度總桿冠軍榜失敗',
            'details': str(e)
        }), 500

@bp.route('/dashboard/champions', methods=['POST'])
def create_champion():
    try:
        data = request.get_json()
        champion = YearlyChampion.from_dict(data)
        db.session.add(champion)
        db.session.commit()
        return jsonify(champion.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"創建年度總桿冠軍記錄失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '創建年度總桿冠軍記錄失敗',
            'details': str(e)
        }), 500

@bp.route('/dashboard/champions/<int:id>', methods=['PUT'])
def update_champion(id):
    try:
        champion = YearlyChampion.query.get_or_404(id)
        data = request.get_json()
        
        champion.tournament_name = data.get('tournament_name', champion.tournament_name)
        champion.player_name = data.get('player_name', champion.player_name)
        champion.total_strokes = data.get('total_strokes', champion.total_strokes)
        champion.date = datetime.fromisoformat(data.get('date')) if data.get('date') else champion.date
        
        db.session.commit()
        return jsonify(champion.to_dict())
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新年度總桿冠軍記錄失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '更新年度總桿冠軍記錄失敗',
            'details': str(e)
        }), 500

@bp.route('/dashboard/champions/<int:id>', methods=['DELETE'])
def delete_champion(id):
    try:
        champion = YearlyChampion.query.get_or_404(id)
        db.session.delete(champion)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"刪除年度總桿冠軍記錄失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '刪除年度總桿冠軍記錄失敗',
            'details': str(e)
        }), 500
