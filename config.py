import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # 資料庫配置
    database_url = os.environ.get('DATABASE_URL')
    print(f"原始 DATABASE_URL: {database_url}")
    
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
            print(f"修改後的 DATABASE_URL: {database_url}")
        SQLALCHEMY_DATABASE_URI = database_url
    else:
        print("警告：未找到 DATABASE_URL 環境變數，使用 SQLite")
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
    
    print(f"最終使用的 SQLALCHEMY_DATABASE_URI: {SQLALCHEMY_DATABASE_URI}")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 安全配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change-in-production'
    
    # 其他配置
    DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'
