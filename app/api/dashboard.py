from flask import Blueprint, jsonify, current_app, request
from app.models import (
    Member, Tournament, YearlyChampion, 
    db, Announcement, SystemConfig
)
from datetime import datetime
from sqlalchemy import func
import traceback

# Create blueprint with proper API name
dashboard_api = Blueprint('dashboard_api', __name__)

@dashboard_api.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        current_app.logger.info("開始獲取儀表板統計數據")
        
        # 獲取所有非來賓會員
        members = Member.query.filter_by(is_guest=False).all()
        member_count = len(members)
        current_app.logger.info(f"會員數量: {member_count}")

        # 根據會員編號判斷性別統計
        male_count = sum(1 for m in members if not m.member_number or not m.member_number.startswith('F'))
        female_count = sum(1 for m in members if m.member_number and m.member_number.startswith('F'))
        current_app.logger.info(f"男性會員: {male_count}, 女性會員: {female_count}")

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
            'male_count': male_count,
            'female_count': female_count,
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

@dashboard_api.route('/dashboard/champions', methods=['GET'])
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

@dashboard_api.route('/dashboard/champions', methods=['POST'])
def create_champion():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': '缺少必要的資料'}), 400

        champion = YearlyChampion(
            year=data['year'],
            tournament_name=data['tournament_name'],
            member_name=data['member_name'],
            total_strokes=data['total_strokes'],
            date=datetime.now()
        )
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

@dashboard_api.route('/dashboard/champions/<int:id>', methods=['PUT'])
def update_champion(id):
    try:
        champion = YearlyChampion.query.get_or_404(id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '缺少必要的資料'}), 400
        
        champion.year = data.get('year', champion.year)
        champion.tournament_name = data.get('tournament_name', champion.tournament_name)
        champion.member_name = data.get('member_name', champion.member_name)
        champion.total_strokes = data.get('total_strokes', champion.total_strokes)
        
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

@dashboard_api.route('/dashboard/champions/<int:id>', methods=['DELETE'])
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

@dashboard_api.route('/dashboard/announcements', methods=['GET'])
def get_announcements():
    try:
        announcements = Announcement.query.order_by(Announcement.created_at.desc()).all()
        return jsonify([a.to_dict() for a in announcements])
    except Exception as e:
        current_app.logger.error(f"獲取公告列表失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取公告列表失敗',
            'details': str(e)
        }), 500

@dashboard_api.route('/dashboard/announcements', methods=['POST'])
def create_announcement():
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': '缺少必要的內容欄位'}), 400
        
        announcement = Announcement(content=data['content'])
        db.session.add(announcement)
        db.session.commit()
        return jsonify(announcement.to_dict())
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"創建公告失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '創建公告失敗',
            'details': str(e)
        }), 500

@dashboard_api.route('/dashboard/announcements/<int:id>', methods=['PUT'])
def update_announcement(id):
    try:
        announcement = Announcement.query.get_or_404(id)
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({'error': '缺少必要的內容欄位'}), 400
        
        announcement.content = data['content']
        db.session.commit()
        return jsonify(announcement.to_dict())
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新公告失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '更新公告失敗',
            'details': str(e)
        }), 500

@dashboard_api.route('/dashboard/announcements/<int:id>', methods=['DELETE'])
def delete_announcement(id):
    try:
        announcement = Announcement.query.get_or_404(id)
        db.session.delete(announcement)
        db.session.commit()
        return jsonify({'message': '公告已刪除'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"刪除公告失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '刪除公告失敗',
            'details': str(e)
        }), 500

@dashboard_api.route('/version', methods=['GET'])
def get_version():
    try:
        config = SystemConfig.query.filter_by(key='version').first()
        if not config:
            config = SystemConfig(key='version', value='V2.0')
            db.session.add(config)
            db.session.commit()
        
        return jsonify({
            'version': config.value
        })
    except Exception as e:
        current_app.logger.error(f"獲取版本信息失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取版本信息失敗',
            'details': str(e)
        }), 500

@dashboard_api.route('/version', methods=['POST'])
def update_version():
    try:
        data = request.get_json()
        if not data or 'version' not in data:
            return jsonify({'error': '缺少版本信息'}), 400
            
        config = SystemConfig.query.filter_by(key='version').first()
        if not config:
            config = SystemConfig(key='version', value=data['version'])
            db.session.add(config)
        else:
            config.value = data['version']
            
        db.session.commit()
        return jsonify({
            'version': config.value,
            'message': '版本更新成功'
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新版本信息失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '更新版本信息失敗',
            'details': str(e)
        }), 500

@dashboard_api.route('/version/description', methods=['GET'])
def get_version_description():
    try:
        config = SystemConfig.query.filter_by(key='version_description').first()
        if not config:
            default_description = '版本功能說明：\n1. 會員管理功能\n2. 賽事管理功能\n3. 成績管理功能\n4. 報表分析功能'
            config = SystemConfig(key='version_description', value=default_description)
            db.session.add(config)
            db.session.commit()
            
        return jsonify({
            'description': config.value
        })
    except Exception as e:
        current_app.logger.error(f"獲取版本功能說明失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取版本功能說明失敗',
            'details': str(e)
        }), 500

@dashboard_api.route('/version/description', methods=['POST'])
def update_version_description():
    try:
        data = request.get_json()
        if not data or 'description' not in data:
            return jsonify({'error': '缺少版本功能說明'}), 400
            
        config = SystemConfig.query.filter_by(key='version_description').first()
        if not config:
            config = SystemConfig(key='version_description', value=data['description'])
            db.session.add(config)
        else:
            config.value = data['description']
            
        db.session.commit()
        return jsonify({
            'description': config.value,
            'message': '版本功能說明更新成功'
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新版本功能說明失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '更新版本功能說明失敗',
            'details': str(e)
        }), 500
