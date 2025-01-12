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
        from app.models import SystemConfig
        
        # 檢查是否需要初始化系統配置
        if not SystemConfig.query.first():
            print('初始化系統配置...')
            version = SystemConfig(
                key='version',
                value='1.0.0',
                description='系統版本'
            )
            db.session.add(version)
            db.session.commit()
            print('系統配置初始化完成')
        else:
            print('系統配置已存在，跳過初始化')
            
    except Exception as e:
        print(f'錯誤: {str(e)}')
        raise

if __name__ == '__main__':
    app.run()
