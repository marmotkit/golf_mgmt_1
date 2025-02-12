from app import create_app
from app.models import db, AwardType

def init_award_types():
    app = create_app()
    with app.app_context():
        # 檢查是否已有獎項類型
        if AwardType.query.first():
            print("獎項類型已存在，跳過初始化")
            return

        # 定義預設獎項類型
        default_types = [
            # 技術獎-一般組
            {
                'name': '技術獎-一般組-1近洞',
                'description': '一般組第一近洞',
                'has_hole_number': True,
                'max_winners': None,  # 可以多人
                'is_active': True
            },
            {
                'name': '技術獎-一般組-2近洞',
                'description': '一般組第二近洞',
                'has_hole_number': True,
                'max_winners': None,  # 可以多人
                'is_active': True
            },
            {
                'name': '技術獎-一般組-3近洞',
                'description': '一般組第三近洞',
                'has_hole_number': True,
                'max_winners': None,  # 可以多人
                'is_active': True
            },
            # 技術獎-長青組
            {
                'name': '技術獎-長青組-1近洞',
                'description': '長青組第一近洞',
                'has_hole_number': True,
                'max_winners': None,  # 可以多人
                'is_active': True
            },
            # 總桿冠軍
            {
                'name': '總桿冠軍',
                'description': '總桿數最少者',
                'has_score': True,
                'max_winners': 1,  # 只有1人
                'is_active': True
            },
            # 淨桿獎 1-10名
            {
                'name': '淨桿獎',
                'description': '淨桿成績',
                'has_score': True,
                'has_rank': True,
                'max_winners': 10,  # 10人
                'is_active': True
            },
            # 會長獎
            {
                'name': '會長獎',
                'description': '會長特別獎',
                'max_winners': 1,  # 只有1人
                'is_active': True
            },
            # BB獎
            {
                'name': 'BB獎',
                'description': '特殊表現獎',
                'max_winners': 1,  # 只有1人
                'is_active': True
            },
            # Eagle獎
            {
                'name': 'Eagle獎',
                'description': 'Eagle成就',
                'max_winners': None,  # 可以多人
                'is_active': True
            },
            # HIO
            {
                'name': 'HIO',
                'description': '一桿進洞',
                'max_winners': 1,  # 只有1人
                'is_active': True
            },
            # 其他
            {
                'name': '其他',
                'description': '臨時增加的特殊獎項',
                'max_winners': None,  # 可以多人
                'is_active': True
            }
        ]

        # 創建獎項類型
        for type_data in default_types:
            award_type = AwardType(**type_data)
            db.session.add(award_type)

        try:
            db.session.commit()
            print("成功初始化獎項類型")
        except Exception as e:
            db.session.rollback()
            print(f"初始化獎項類型時發生錯誤: {str(e)}")

if __name__ == '__main__':
    init_award_types() 