from flask import jsonify, request
from app import db
from app.models import Game, GamePrize
from app.api import games_api
from app.api.errors import bad_request

@games_api.route('/games', methods=['GET'])
def get_games():
    games = Game.query.order_by(Game.created_at.desc()).all()
    return jsonify([game.to_dict() for game in games])

@games_api.route('/games/<int:id>', methods=['GET'])
def get_game(id):
    game = Game.query.get_or_404(id)
    return jsonify(game.to_dict())

@games_api.route('/games', methods=['POST'])
def create_game():
    data = request.get_json() or {}
    if 'name' not in data:
        return bad_request('必須包含遊戲名稱')
    
    game = Game(
        name=data['name'],
        description=data.get('description', ''),
        rules=data.get('rules', ''),
        type=data.get('type', 'default'),
        config=data.get('config', {})
    )
    
    # 如果是轉盤遊戲，初始化獎項
    if game.type == 'wheel':
        prize_count = data.get('prize_count', 6)  # 預設6個獎項
        for i in range(prize_count):
            prize = GamePrize(
                game=game,
                name=f'獎項 {i+1}',
                description='',
                position=i
            )
            db.session.add(prize)
    
    db.session.add(game)
    db.session.commit()
    return jsonify(game.to_dict()), 201

@games_api.route('/games/<int:id>', methods=['PUT'])
def update_game(id):
    game = Game.query.get_or_404(id)
    data = request.get_json() or {}
    
    if 'name' not in data:
        return bad_request('必須包含遊戲名稱')
    
    game.name = data['name']
    game.description = data.get('description', game.description)
    game.rules = data.get('rules', game.rules)
    game.type = data.get('type', game.type)
    game.config = data.get('config', game.config)
    
    db.session.commit()
    return jsonify(game.to_dict())

@games_api.route('/games/<int:id>', methods=['DELETE'])
def delete_game(id):
    game = Game.query.get_or_404(id)
    db.session.delete(game)
    db.session.commit()
    return '', 204

# 獎項相關的 API 端點
@games_api.route('/games/<int:game_id>/prizes', methods=['GET'])
def get_game_prizes(game_id):
    game = Game.query.get_or_404(game_id)
    return jsonify([prize.to_dict() for prize in game.prizes])

@games_api.route('/games/<int:game_id>/prizes/<int:position>', methods=['PUT'])
def update_game_prize(game_id, position):
    if position < 0 or position >= 24:
        return bad_request('獎項位置必須在 0-23 之間')
    
    game = Game.query.get_or_404(game_id)
    prize = GamePrize.query.filter_by(game_id=game_id, position=position).first_or_404()
    
    data = request.get_json() or {}
    if 'name' not in data:
        return bad_request('必須包含獎項名稱')
    
    prize.name = data['name']
    prize.description = data.get('description', prize.description)
    
    db.session.commit()
    return jsonify(prize.to_dict()) 