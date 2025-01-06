from flask import jsonify, request
from app.api import bp
from app.models import Tournament, db

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
    data = request.get_json()
    tournament = Tournament()
    tournament.from_dict(data)
    db.session.add(tournament)
    db.session.commit()
    return jsonify(tournament.to_dict()), 201

@bp.route('/tournaments/<int:id>', methods=['PUT'])
def update_tournament(id):
    tournament = Tournament.query.get_or_404(id)
    data = request.get_json()
    tournament.from_dict(data)
    db.session.commit()
    return jsonify(tournament.to_dict())

@bp.route('/tournaments/<int:id>', methods=['DELETE'])
def delete_tournament(id):
    tournament = Tournament.query.get_or_404(id)
    db.session.delete(tournament)
    db.session.commit()
    return '', 204
