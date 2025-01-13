from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 配置 CORS
    CORS(app, resources={
        r"/*": {  # 允許所有路徑
            "origins": [
                "http://localhost:3000",
                "https://golf-mgmt-1-frontend.onrender.com"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    db.init_app(app)
    migrate.init_app(app, db)

    # 註冊 API 藍圖
    from app.api import members, tournaments, scores, games, reports, dashboard, version
    app.register_blueprint(members.bp, url_prefix='/api/members')  
    app.register_blueprint(tournaments.bp, url_prefix='/api/tournaments')  
    app.register_blueprint(scores.bp, url_prefix='/api/scores')  
    app.register_blueprint(games.bp, url_prefix='/api/games')  
    app.register_blueprint(reports.bp, url_prefix='/api/reports')  
    app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')  
    app.register_blueprint(version.bp, url_prefix='/api/version')  

    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}

    @app.route('/test')
    def test():
        return {'message': 'API is working'}

    return app
