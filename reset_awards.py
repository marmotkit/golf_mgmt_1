from app import create_app
from app.models import db, AwardType
from init_award_types import init_award_types

def reset_award_types():
    app = create_app()
    with app.app_context():
        # 刪除所有獎項類型
        AwardType.query.delete()
        db.session.commit()
        print("已清除所有獎項類型")
        
        # 重新初始化獎項類型
        init_award_types()
        print("已重新初始化獎項類型")

if __name__ == '__main__':
    reset_award_types() 