from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config
import logging
import sys

# 配置日誌
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 記錄配置信息
    logger.info('Starting application...')
    logger.info(f'SQLALCHEMY_DATABASE_URI: {app.config["SQLALCHEMY_DATABASE_URI"]}')
    
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
    logger.info('CORS configured')

    try:
        db.init_app(app)
        migrate.init_app(app, db)
        logger.info('Database initialized')
        
        # 檢查資料庫連接
        with app.app_context():
            db.engine.execute('SELECT 1')
            logger.info('Database connection test successful')
            
            # 檢查 versions 表是否存在
            result = db.engine.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'versions')"
            ).scalar()
            logger.info(f'Versions table exists: {result}')
            
    except Exception as e:
        logger.error(f'Error initializing database: {str(e)}')
        raise

    # 註冊 API 藍圖
    try:
        from app.api import members, tournaments, scores, games, reports, dashboard, version
        app.register_blueprint(members.bp, url_prefix='/api/members')  
        app.register_blueprint(tournaments.bp, url_prefix='/api/tournaments')  
        app.register_blueprint(scores.bp, url_prefix='/api/scores')  
        app.register_blueprint(games.bp, url_prefix='/api/games')  
        app.register_blueprint(reports.bp, url_prefix='/api/reports')  
        app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')  
        app.register_blueprint(version.bp, url_prefix='/api/version')  
        logger.info('All blueprints registered')
    except Exception as e:
        logger.error(f'Error registering blueprints: {str(e)}')
        raise

    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}

    @app.route('/test')
    def test():
        return {'message': 'API is working'}

    logger.info('Application created successfully')
    return app
