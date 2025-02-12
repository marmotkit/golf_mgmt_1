from app import create_app, db
from app.models import AwardType

def init_award_types():
    app = create_app()
    with app.app_context():
        # 檢查是否已有獎項類型
        if AwardType.query.count() > 0:
            print("獎項類型已存在，跳過初始化")
            return

        # 定義預設獎項類型
        default_types = [
            {
                'name': '技術獎',
                'description': '最佳技術表現獎項',
                'has_category': True,
                'has_score': True,
                'has_rank': False,
                'has_hole_number': False,
                'max_winners': None,
                'is_active': True
            },
            {
                'name': '跳跳獎',
                'description': '最大進步獎項',
                'has_category': False,
                'has_score': False,
                'has_rank': False,
                'has_hole_number': False,
                'max_winners': None,
                'is_active': True
            },
            {
                'name': 'BB獎',
                'description': '特殊表現獎項',
                'has_category': False,
                'has_score': False,
                'has_rank': False,
                'has_hole_number': False,
                'max_winners': None,
                'is_active': True
            },
            {
                'name': '總桿冠軍',
                'description': '最佳總桿成績',
                'has_category': True,
                'has_score': True,
                'has_rank': True,
                'has_hole_number': False,
                'max_winners': 1,
                'is_active': True
            },
            {
                'name': '淨桿獎',
                'description': '最佳淨桿成績',
                'has_category': True,
                'has_score': True,
                'has_rank': True,
                'has_hole_number': False,
                'max_winners': 3,
                'is_active': True
            },
            {
                'name': 'Eagle獎',
                'description': '老鷹成就獎',
                'has_category': False,
                'has_score': False,
                'has_rank': False,
                'has_hole_number': True,
                'max_winners': None,
                'is_active': True
            },
            {
                'name': 'HIO',
                'description': '一桿進洞',
                'has_category': False,
                'has_score': False,
                'has_rank': False,
                'has_hole_number': True,
                'max_winners': None,
                'is_active': True
            },
            {
                'name': '其他獎項',
                'description': '臨時性或特殊獎項',
                'has_category': False,
                'has_score': False,
                'has_rank': False,
                'has_hole_number': False,
                'max_winners': None,
                'is_active': True
            }
        ]

        try:
            # 創建獎項類型
            for type_data in default_types:
                award_type = AwardType(**type_data)
                db.session.add(award_type)
            
            db.session.commit()
            print("成功初始化獎項類型")
        except Exception as e:
            db.session.rollback()
            print(f"初始化獎項類型時發生錯誤: {str(e)}")
            raise

if __name__ == '__main__':
    init_award_types() 