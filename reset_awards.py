from app import create_app
from app.models import db, AwardType, TournamentAward
from init_award_types import init_award_types

def reset_award_types():
    app = create_app()
    with app.app_context():
        try:
            # 先刪除所有賽事獎項記錄
            print("正在刪除所有賽事獎項記錄...")
            TournamentAward.query.delete()
            db.session.commit()
            print("已刪除所有賽事獎項記錄")
            
            # 再刪除所有獎項類型
            print("正在刪除所有獎項類型...")
            AwardType.query.delete()
            db.session.commit()
            print("已刪除所有獎項類型")
            
            # 重新初始化獎項類型
            init_award_types()
            print("已重新初始化獎項類型")
            
            # 調整獎項順序
            print("正在調整獎項順序...")
            # 獲取跳跳獎和總桿冠軍
            jump_award = AwardType.query.filter_by(name='跳跳獎').first()
            champion_award = AwardType.query.filter_by(name='總桿冠軍').first()
            
            if jump_award and champion_award:
                # 交換它們的 id
                temp_id = jump_award.id
                jump_award.id = champion_award.id
                champion_award.id = temp_id
                db.session.commit()
                print("獎項順序調整成功")
            else:
                print("找不到需要調整順序的獎項")
            
        except Exception as e:
            db.session.rollback()
            print(f"重置獎項類型時發生錯誤: {str(e)}")
            raise

if __name__ == '__main__':
    reset_award_types() 