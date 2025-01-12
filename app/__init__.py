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

# 導入路由和模型
from app import routes, models

# 確保導出 app 實例
__all__ = ['app', 'db']
