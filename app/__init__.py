from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
import logging
import sys
from sqlalchemy import text, inspect
import traceback

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
    @app.after_request
    def add_cors_headers(response):
        if request.method == "OPTIONS":
            # 處理預檢請求
            response = app.make_default_options_response()
        
        # 檢查是否來自允許的域名
        if request.headers.get("Origin") == "https://golf-mgmt-1-frontend.onrender.com":
            # 刪除可能存在的舊頭部
            response.headers.pop("Access-Control-Allow-Origin", None)
            response.headers.pop("Access-Control-Allow-Methods", None)
            response.headers.pop("Access-Control-Allow-Headers", None)
            response.headers.pop("Access-Control-Allow-Credentials", None)
            
            # 添加新的頭部
            response.headers.set("Access-Control-Allow-Origin", "https://golf-mgmt-1-frontend.onrender.com")
            response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin")
            response.headers.set("Access-Control-Allow-Credentials", "true")
            
            if request.method == "OPTIONS":
                response.headers.set("Access-Control-Max-Age", "3600")
                
        return response
        
    logger.info('CORS configured')

    try:
        # 初始化資料庫
        db.init_app(app)
        migrate.init_app(app, db)
        logger.info('Database initialized')
        
        # 確保所有表都存在並執行遷移
        with app.app_context():
            logger.info('Checking database tables and running migrations...')
            try:
                from flask_migrate import upgrade
                upgrade()
                logger.info('Database migrations completed successfully')
                
                # 檢查獎項類型表是否為空
                from app.models import AwardType
                if not AwardType.query.first():
                    logger.info('Initializing award types...')
                    default_types = [
                        {
                            'name': '總桿冠軍',
                            'description': '總桿數最少者',
                            'has_score': True,
                            'has_rank': True,
                            'max_winners': 1,
                            'is_active': True
                        },
                        {
                            'name': '淨桿冠軍',
                            'description': '淨桿數最少者',
                            'has_score': True,
                            'has_rank': True,
                            'max_winners': 1,
                            'is_active': True
                        },
                        {
                            'name': '淨桿亞軍',
                            'description': '淨桿數第二少者',
                            'has_score': True,
                            'has_rank': True,
                            'max_winners': 1,
                            'is_active': True
                        },
                        {
                            'name': '淨桿季軍',
                            'description': '淨桿數第三少者',
                            'has_score': True,
                            'has_rank': True,
                            'max_winners': 1,
                            'is_active': True
                        },
                        {
                            'name': '一桿進洞',
                            'description': '一桿進洞者',
                            'has_hole_number': True,
                            'max_winners': None,
                            'is_active': True
                        },
                        {
                            'name': '最近洞獎',
                            'description': '最接近洞口者',
                            'has_hole_number': True,
                            'max_winners': None,
                            'is_active': True
                        },
                        {
                            'name': '最遠洞獎',
                            'description': '最遠距離進洞者',
                            'has_hole_number': True,
                            'max_winners': None,
                            'is_active': True
                        }
                    ]
                    
                    for type_data in default_types:
                        award_type = AwardType(**type_data)
                        db.session.add(award_type)
                    
                    db.session.commit()
                    logger.info('Award types initialized successfully')
            except Exception as e:
                logger.error(f'Error in database setup: {str(e)}')
                logger.error(traceback.format_exc())
                raise
        
        # 檢查資料庫連接
        if not check_database_connection(app):
            raise Exception("Database connection check failed")
            
    except Exception as e:
        logger.error(f'Error initializing database: {str(e)}')
        raise

    # 註冊 API 藍圖
    try:
        from app.api import members, tournaments, scores, games, reports, dashboard, version, awards
        app.register_blueprint(members.bp, url_prefix='/api/members')  
        app.register_blueprint(tournaments.bp, url_prefix='/api/tournaments')  
        app.register_blueprint(scores.bp, url_prefix='/api/scores')  
        app.register_blueprint(games.bp, url_prefix='/api/games')  
        app.register_blueprint(reports.bp, url_prefix='/api/reports')  
        app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')  
        app.register_blueprint(version.bp, url_prefix='/api/version')  
        app.register_blueprint(awards.bp, url_prefix='/api/awards')  
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
