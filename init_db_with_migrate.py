from app import create_app, db
from flask_migrate import upgrade
from init_award_types import init_award_types
from sqlalchemy import inspect

def init_db():
    app = create_app()
    with app.app_context():
        # 檢查表是否已存在
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        print(f"現有的表: {existing_tables}")
        
        # 如果沒有任何表，才創建表
        if not existing_tables:
            print("數據庫為空，開始創建表...")
            db.create_all()
            print("數據庫表創建成功")
            
            # 執行所有待處理的遷移
            upgrade()
            print("數據庫遷移完成")
            
            # 初始化獎項類型
            init_award_types()
            print("獎項類型初始化完成")
        else:
            print("數據庫表已存在，跳過初始化步驟")

if __name__ == '__main__':
    init_db() 