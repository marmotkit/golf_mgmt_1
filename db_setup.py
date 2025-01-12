import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, upgrade

# 創建一個最小的應用程式實例
app = Flask(__name__)

# 配置資料庫
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化資料庫
db = SQLAlchemy(app)
migrate = Migrate(app, db)

def run_migrations():
    print("開始執行資料庫遷移...")
    try:
        with app.app_context():
            upgrade()
        print("資料庫遷移完成")
        return True
    except Exception as e:
        print(f"資料庫遷移失敗: {str(e)}")
        return False

if __name__ == '__main__':
    success = run_migrations()
    exit(0 if success else 1) 