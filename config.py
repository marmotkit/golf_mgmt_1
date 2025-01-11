import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "your-secret-key"  # 用於 JWT 的密鑰
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # 訪問令牌過期時間
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')  # 修改為 uploads 目錄

# 確保上傳目錄存在
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
