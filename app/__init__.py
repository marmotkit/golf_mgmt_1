from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config
import logging
import sys
from sqlalchemy import text, inspect

# 配置日誌
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()

def check_database_connection(app):
    """檢查資料庫連接和表的存在性"""
    try:
        with app.app_context():
            # 使用 session 而不是 engine 來執行查詢
            # 檢查資料庫連接
            result = db.session.execute(text('SELECT 1')).scalar()
            logger.info('Database connection test successful')
            
            # 使用 SQLAlchemy 的 inspect 來檢查表是否存在
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            versions_exists = 'versions' in tables
            logger.info(f'Versions table exists: {versions_exists}')
            
            # 確保更改被提交
            db.session.commit()
            
            return True
    except Exception as e:
        logger.error(f'Database check failed: {str(e)}')
        return False

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 記錄配置信息
    logger.info('Starting application...')
    logger.info(f'SQLALCHEMY_DATABASE_URI: {app.config["SQLALCHEMY_DATABASE_URI"]}')
    
    # 配置 CORS
    CORS(app, 
        resources={
            r"/api/*": {
                "origins": ["https://golf-mgmt-1-frontend.onrender.com"],
                "supports_credentials": True,
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "expose_headers": ["Content-Type", "Authorization"]
            }
        }
    )
    
    logger.info('CORS configured')

    @app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        return '', 204
        
    try:
        # 初始化資料庫
        db.init_app(app)
        migrate.init_app(app, db)
        logger.info('Database initialized')
        
        # 檢查資料庫連接
        if not check_database_connection(app):
            raise Exception("Database connection check failed")
            
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
