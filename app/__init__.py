from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config
import logging
import os

# 初始化 SQLAlchemy
db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化擴展
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # 配置 CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["https://golf-mgmt.vercel.app", "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # 配置日誌
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = logging.FileHandler('logs/golf_mgmt.log')
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Golf Management startup')
    
    # 註冊藍圖
    from app.api import members, tournaments, scores, dashboard, reports, games
    app.register_blueprint(members.bp, url_prefix='/api')
    app.register_blueprint(tournaments.bp, url_prefix='/api')
    app.register_blueprint(scores.bp, url_prefix='/api')
    app.register_blueprint(dashboard.dashboard_api, url_prefix='/api/dashboard')
    app.register_blueprint(reports.bp, url_prefix='/api')
    app.register_blueprint(games.games_api, url_prefix='/api')
    
    return app

from app import models
