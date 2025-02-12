from app import create_app, db
from flask_migrate import upgrade
from init_award_types import init_award_types

def init_db():
    app = create_app()
    with app.app_context():
        # 創建所有表
        db.create_all()
        print("數據庫表創建成功")
        
        # 執行所有待處理的遷移
        upgrade()
        print("數據庫遷移完成")
        
        # 初始化獎項類型
        init_award_types()
        print("獎項類型初始化完成")

if __name__ == '__main__':
    init_db() 