from flask_migrate import upgrade
from app import app, db

def run_migrations():
    print("開始執行資料庫遷移...")
    with app.app_context():
        try:
            upgrade()
            print("資料庫遷移完成")
        except Exception as e:
            print(f"資料庫遷移失敗: {str(e)}")
            raise e

if __name__ == '__main__':
    run_migrations() 