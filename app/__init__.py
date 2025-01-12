from flask import Flask, send_from_directory, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
    app.config.from_object(config_class)

    # 配置 CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "https://golf-mgmt-1.onrender.com",
                "https://golf-mgmt-1.app.render.com"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    db.init_app(app)
    migrate.init_app(app, db)

    # 註冊 API 藍圖
    from app.api import members, tournaments, scores, games, reports, dashboard
    app.register_blueprint(members.bp, url_prefix='/api', name='members_api')
    app.register_blueprint(tournaments.bp, url_prefix='/api', name='tournaments_api')
    app.register_blueprint(scores.bp, url_prefix='/api', name='scores_api')
    app.register_blueprint(games.bp, url_prefix='/api', name='games_api')
    app.register_blueprint(reports.bp, url_prefix='/api/reports', name='reports_api')

    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_file(os.path.join(app.static_folder, 'index.html'))

    return app

from app import models
