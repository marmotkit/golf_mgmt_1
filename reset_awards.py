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
            print("正在初始化獎項類型...")
            
            # 定義預設獎項類型（按照正確的順序）
            default_types = [
                # A1. 一般組技術獎
                {
                    'name': '技術獎-一般組-1近洞',
                    'description': '一般組第一近洞',
                    'has_hole_number': True,
                    'max_winners': None,
                    'is_active': True
                },
                {
                    'name': '技術獎-一般組-2近洞',
                    'description': '一般組第二近洞',
                    'has_hole_number': True,
                    'max_winners': None,
                    'is_active': True
                },
                {
                    'name': '技術獎-一般組-3近洞',
                    'description': '一般組第三近洞',
                    'has_hole_number': True,
                    'max_winners': None,
                    'is_active': True
                },
                # A2. 長青組技術獎
                {
                    'name': '技術獎-長青組-1近洞',
                    'description': '長青組第一近洞',
                    'has_hole_number': True,
                    'max_winners': None,
                    'is_active': True
                },
                # B. 跳跳獎（放在總桿冠軍前面）
                {
                    'name': '跳跳獎',
                    'description': '',
                    'max_winners': None,
                    'is_active': True
                },
                # C. 總桿冠軍
                {
                    'name': '總桿冠軍',
                    'description': '總桿數最少者',
                    'has_score': True,
                    'max_winners': 1,
                    'is_active': True
                },
                # D. 淨桿獎
                {
                    'name': '淨桿獎',
                    'description': '淨桿成績',
                    'has_score': True,
                    'has_rank': True,
                    'max_winners': 10,
                    'is_active': True
                },
                # E. 會長獎
                {
                    'name': '會長獎',
                    'description': '會長特別獎',
                    'max_winners': 1,
                    'is_active': True
                },
                # F. BB獎
                {
                    'name': 'BB獎',
                    'description': '特殊表現獎',
                    'max_winners': 1,
                    'is_active': True
                },
                # G. Eagle獎
                {
                    'name': 'Eagle獎',
                    'description': 'Eagle成就',
                    'max_winners': None,
                    'is_active': True
                },
                # H. HIO
                {
                    'name': 'HIO',
                    'description': '一桿進洞',
                    'has_hole_number': True,
                    'max_winners': 1,
                    'is_active': True
                },
                # I. 其他
                {
                    'name': '其他',
                    'description': '臨時增加的特殊獎項',
                    'max_winners': None,
                    'is_active': True
                }
            ]
            
            # 創建獎項類型
            for type_data in default_types:
                award_type = AwardType(**type_data)
                db.session.add(award_type)
            
            db.session.commit()
            print("獎項類型初始化成功")
            
        except Exception as e:
            db.session.rollback()
            print(f"重置獎項類型時發生錯誤: {str(e)}")
            raise

if __name__ == '__main__':
    reset_award_types() 