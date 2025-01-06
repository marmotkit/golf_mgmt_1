from flask import jsonify, request
from app.api import bp
from app.models import Score, db

@bp.route('/scores', methods=['GET'])
def get_scores():
    scores = Score.query.all()
    return jsonify([s.to_dict() for s in scores])

@bp.route('/scores/<int:id>', methods=['GET'])
def get_score(id):
    score = Score.query.get_or_404(id)
    return jsonify(score.to_dict())

@bp.route('/scores', methods=['POST'])
def create_score():
    data = request.get_json()
    score = Score()
    score.from_dict(data)
    db.session.add(score)
    db.session.commit()
    return jsonify(score.to_dict()), 201

@bp.route('/scores/<int:id>', methods=['PUT'])
def update_score(id):
    score = Score.query.get_or_404(id)
    data = request.get_json()
    score.from_dict(data)
    db.session.commit()
    return jsonify(score.to_dict())

@bp.route('/scores/<int:id>', methods=['DELETE'])
def delete_score(id):
    score = Score.query.get_or_404(id)
    db.session.delete(score)
    db.session.commit()
    return '', 204
