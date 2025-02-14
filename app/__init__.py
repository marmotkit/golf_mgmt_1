from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
import logging
import sys
from sqlalchemy import text, inspect
import traceback
from flask_jwt_extended import JWTManager

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
    
    # 初始化 JWT
    jwt = JWTManager(app)
    
    # 記錄配置信息
    logger.info('Starting application...')
    logger.info(f'SQLALCHEMY_DATABASE_URI: {app.config["SQLALCHEMY_DATABASE_URI"]}')
    
    # 配置 CORS
    @app.after_request
    def add_cors_headers(response):
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
        
        # 允許所有來源的請求（開發階段）
        response.headers.pop("Access-Control-Allow-Origin", None)
        response.headers.pop("Access-Control-Allow-Methods", None)
        response.headers.pop("Access-Control-Allow-Headers", None)
        response.headers.pop("Access-Control-Allow-Credentials", None)
        
        response.headers.set("Access-Control-Allow-Origin", request.headers.get("Origin", "*"))
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
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
                # 檢查表是否存在
                inspector = inspect(db.engine)
                tables = inspector.get_table_names()
                logger.info(f'Existing tables: {tables}')
                
                # 如果 award_types 表不存在，創建它
                if 'award_types' not in tables:
                    logger.info('Creating award_types table...')
                    from app.models import AwardType
                    AwardType.__table__.create(db.engine)
                    logger.info('award_types table created successfully')
                
                # 初始化獎項類型
                from app.models import AwardType
                if not AwardType.query.first():
                    logger.info('Initializing award types...')
                    default_types = [
                        {
                            'name': '技術獎-一般組-1近洞',
                            'description': '一般組第一近洞',
                            'max_winners': None,
                            'is_active': True
                        },
                        {
                            'name': '技術獎-一般組-2近洞',
                            'description': '一般組第二近洞',
                            'max_winners': None,
                            'is_active': True
                        },
                        {
                            'name': '技術獎-一般組-3近洞',
                            'description': '一般組第三近洞',
                            'max_winners': None,
                            'is_active': True
                        },
                        {
                            'name': '技術獎-長青組-1近洞',
                            'description': '長青組第一近洞',
                            'max_winners': None,
                            'is_active': True
                        },
                        {
                            'name': '總桿冠軍',
                            'description': '總桿數最少者',
                            'has_score': True,
                            'max_winners': 1,
                            'is_active': True
                        },
                        {
                            'name': '淨桿獎',
                            'description': '淨桿成績',
                            'has_score': True,
                            'has_rank': True,
                            'max_winners': 10,
                            'is_active': True
                        },
                        {
                            'name': '會長獎',
                            'description': '會長特別獎',
                            'max_winners': 1,
                            'is_active': True
                        },
                        {
                            'name': 'BB獎',
                            'description': '特殊表現獎',
                            'max_winners': 1,
                            'is_active': True
                        },
                        {
                            'name': 'Eagle獎',
                            'description': 'Eagle成就',
                            'max_winners': None,
                            'is_active': True
                        },
                        {
                            'name': 'HIO',
                            'description': '一桿進洞',
                            'max_winners': 1,
                            'is_active': True
                        },
                        {
                            'name': '其他',
                            'description': '臨時增加的特殊獎項',
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
                db.session.rollback()
                # 不要在這裡 raise，讓應用繼續運行
            
            # 檢查資料庫連接
            if not check_database_connection(app):
                logger.error("Database connection check failed")
                # 不要在這裡 raise，讓應用繼續運行
            
    except Exception as e:
        logger.error(f'Error initializing database: {str(e)}')
        logger.error(traceback.format_exc())
        # 不要在這裡 raise，讓應用繼續運行

    # 註冊 API 藍圖
    try:
        from app.api import members, tournaments, scores, games, reports, dashboard, version, awards, auth
        app.register_blueprint(members.bp, url_prefix='/api/members')  
        app.register_blueprint(tournaments.bp, url_prefix='/api/tournaments')  
        app.register_blueprint(scores.bp, url_prefix='/api/scores')  
        app.register_blueprint(games.bp, url_prefix='/api/games')  
        app.register_blueprint(reports.bp, url_prefix='/api/reports')  
        app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')  
        app.register_blueprint(version.bp, url_prefix='/api/version')  
        app.register_blueprint(awards.bp, url_prefix='/api/awards')
        app.register_blueprint(auth.bp, url_prefix='/api/auth')
        logger.info('All blueprints registered')
    except Exception as e:
        logger.error(f'Error registering blueprints: {str(e)}')
        logger.error(traceback.format_exc())
        # 不要在這裡 raise，讓應用繼續運行

    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}

    @app.route('/test')
    def test():
        return {'message': 'API is working'}

    logger.info('Application created successfully')
    return app
