from app import app, db
from flask_migrate import upgrade

def init_db():
    try:
        print('執行資料庫遷移...')
        upgrade()
        print('資料庫遷移完成')
        
        print('檢查資料庫連接...')
        db.engine.connect()
        print('資料庫連接成功')
        
        print('執行初始化腳本...')
        import init_db
        print('資料庫初始化完成')
    except Exception as e:
        print(f'錯誤: {str(e)}')
        raise

if __name__ == '__main__':
    init_db()
    app.run()
