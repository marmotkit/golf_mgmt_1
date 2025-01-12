from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

# 初始化 Flask 應用
app = Flask(__name__)
app.config.from_object(Config)

# 初始化擴展
db = SQLAlchemy(app)
migrate = Migrate(app, db)
cors = CORS(app)
jwt = JWTManager(app)

# 確保導出 app 實例
__all__ = ['app', 'db']

# 在所有初始化完成後導入路由和模型
from app import models  # 先導入模型
from app.api import members, tournaments, scores, games, reports, dashboard  # 然後導入路由

# 註冊藍圖，使用唯一名稱
app.register_blueprint(members.bp, url_prefix='/api', name='members_api')
app.register_blueprint(tournaments.bp, url_prefix='/api', name='tournaments_api')
app.register_blueprint(scores.bp, url_prefix='/api', name='scores_api')
app.register_blueprint(games.bp, url_prefix='/api', name='games_api')
app.register_blueprint(reports.bp, url_prefix='/api', name='reports_api')
app.register_blueprint(dashboard.bp, url_prefix='/api', name='dashboard_api')

@app.route('/health')
def health_check():
    return {'status': 'healthy'}
