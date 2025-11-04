from flask import Blueprint, jsonify, request, current_app
from app.models import Member, Tournament, Score
from sqlalchemy import func
from app import db
from datetime import datetime

bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@bp.route('/tournaments', methods=['GET'])
def get_tournaments():
    try:
        tournaments = Tournament.query.order_by(Tournament.date.asc()).all()
        return jsonify([{
            'id': t.id,
            'name': t.name,
            'date': t.date.strftime('%Y-%m-%d')
        } for t in tournaments])
    except Exception as e:
        current_app.logger.error(f"獲取賽事列表失敗: {str(e)}", exc_info=True)
        return jsonify({
            'error': '獲取賽事列表失敗',
            'details': str(e)
        }), 500

@bp.route('/stats', methods=['POST'])
def get_stats():
    try:
        current_app.logger.info("開始獲取報表統計數據")
        data = request.get_json()
        tournament_ids = data.get('tournament_ids', [])
        
        if not tournament_ids:
            return jsonify({
                'error': '請選擇至少一個賽事'
            }), 400
            
        # 獲取選定賽事的所有成績
        scores = Score.query.filter(Score.tournament_id.in_(tournament_ids)).all()
        
        # 根據會員編號前綴（A/B/C/D）分組計算平均差點
        team_handicaps = {}
        for score in scores:
            team = score.member_number[0]  # 取第一個字符作為隊伍標識
            if team not in team_handicaps:
                team_handicaps[team] = []
            if score.new_handicap is not None:  # 確保有差點數據
                team_handicaps[team].append(score.new_handicap)
        
        avg_team_handicaps = {
            team: round(sum(handicaps) / len(handicaps), 2)  # 四捨五入到小數點後2位
            for team, handicaps in team_handicaps.items()
            if handicaps  # 確保有數據才計算平均值
        }
        
        # 根據會員編號前綴計算平均總桿數
        team_scores = {}
        for score in scores:
            team = score.member_number[0]
            if team not in team_scores:
                team_scores[team] = []
            if score.gross_score is not None:  # 確保有總桿數
                team_scores[team].append(score.gross_score)
            
        avg_team_scores = {
            team: round(sum(scores) / len(scores), 2)  # 四捨五入到小數點後2位
            for team, scores in team_scores.items()
            if scores  # 確保有數據才計算平均值
        }
        
        # 獲取總積分（加總）和參與次數
        member_stats = {}
        for score in scores:
            if score.chinese_name not in member_stats:
                member_stats[score.chinese_name] = {
                    'points': 0,
                    'participation_count': set()
                }
            member_stats[score.chinese_name]['points'] += score.points or 0
            # 統計參與的賽事（去重）
            member_stats[score.chinese_name]['participation_count'].add(score.tournament_id)

        # 轉換為列表並計算參與次數
        member_points_list = []
        for name, stats in member_stats.items():
            member_points_list.append({
                'member_name': name,
                'points': stats['points'],
                'participation_count': len(stats['participation_count'])
            })

        # 排序：先按積分降序，積分相同時按參與次數降序
        top_points = sorted(
            member_points_list,
            key=lambda x: (x['points'], x['participation_count']),
            reverse=True
        )
        
        # 獲取前10名平均總桿數
        member_scores = {}
        for score in scores:
            if score.chinese_name not in member_scores:
                member_scores[score.chinese_name] = []
            if score.gross_score is not None:
                member_scores[score.chinese_name].append(score.gross_score)

        avg_member_scores = {
            name: round(sum(scores) / len(scores), 2)
            for name, scores in member_scores.items()
            if scores  # 確保有數據才計算平均值
        }

        top_scores = [
            {'member_name': name, 'gross_score': avg_score}
            for name, avg_score in sorted(
                avg_member_scores.items(),
                key=lambda x: x[1]  # 由低到高排序
            )[:10]
        ]
        
        # 計算差點進步最多的前5名
        handicap_improvements = []
        for score in scores:
            if score.previous_handicap is not None and score.new_handicap is not None:
                improvement = round(score.previous_handicap - score.new_handicap, 2)
                handicap_improvements.append({
                    'member_name': score.chinese_name,
                    'improvement': improvement,
                    'initial_handicap': round(score.previous_handicap, 2),
                    'final_handicap': round(score.new_handicap, 2),
                    'tournament_name': score.tournament.name
                })
        
        # 排序並獲取前5名進步者
        top_improvements = sorted(
            handicap_improvements,
            key=lambda x: x['improvement'],
            reverse=True
        )[:5]
        
        # 計算全勤獎
        member_attendance = {}
        tournament_count = len(tournament_ids)
        
        for score in scores:
            if score.chinese_name not in member_attendance:
                member_attendance[score.chinese_name] = set()
            member_attendance[score.chinese_name].add(score.tournament_id)
        
        perfect_attendance = [
            {'member_name': name}
            for name, tournaments in member_attendance.items()
            if len(tournaments) == tournament_count  # 參加所有選擇的賽事
        ]
        
        response_data = {
            'avg_team_handicaps': avg_team_handicaps,
            'avg_team_scores': avg_team_scores,
            'top_points': top_points,
            'top_scores': top_scores,
            'top_improvements': top_improvements,
            'perfect_attendance': perfect_attendance
        }
        
        current_app.logger.info(f"返回報表數據: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        current_app.logger.error(f"獲取報表統計數據時發生錯誤: {str(e)}", exc_info=True)
        return jsonify({
            'error': '獲取報表統計數據失敗',
            'details': str(e)
        }), 500
