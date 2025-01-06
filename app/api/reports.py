from flask import jsonify
from app.api import bp
from app.models import Score, Tournament, Member
from sqlalchemy import func

@bp.route('/reports/tournament-summary/<int:tournament_id>', methods=['GET'])
def tournament_summary(tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    scores = Score.query.filter_by(tournament_id=tournament_id).all()
    
    summary = {
        'tournament': tournament.to_dict(),
        'total_players': len(scores),
        'scores': [s.to_dict() for s in scores],
        'average_score': sum(s.score for s in scores) / len(scores) if scores else 0
    }
    return jsonify(summary)

@bp.route('/reports/member-history/<int:member_id>', methods=['GET'])
def member_history(member_id):
    member = Member.query.get_or_404(member_id)
    scores = Score.query.filter_by(member_id=member_id).all()
    
    history = {
        'member': member.to_dict(),
        'total_tournaments': len(scores),
        'scores': [s.to_dict() for s in scores],
        'average_score': sum(s.score for s in scores) / len(scores) if scores else 0
    }
    return jsonify(history)

@bp.route('/reports/leaderboard/<int:tournament_id>', methods=['GET'])
def tournament_leaderboard(tournament_id):
    scores = Score.query.filter_by(tournament_id=tournament_id)\
        .order_by(Score.score).all()
    
    leaderboard = [{
        'position': i + 1,
        'member': s.member.to_dict(),
        'score': s.score
    } for i, s in enumerate(scores)]
    
    return jsonify(leaderboard)
