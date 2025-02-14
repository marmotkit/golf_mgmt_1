import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev'
    
    # 優先使用 RENDER_POSTGRES_URL（Render.com 內部服務 URL）
    SQLALCHEMY_DATABASE_URI = os.environ.get('RENDER_POSTGRES_URL') or os.environ.get('DATABASE_URL')
    
    # 如果 URL 以 postgres:// 開頭，轉換為 postgresql://
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    
    # 如果沒有設置資料庫 URL，使用 SQLite
    if not SQLALCHEMY_DATABASE_URI:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or "your-secret-key"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')

# 確保上傳目錄存在
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
