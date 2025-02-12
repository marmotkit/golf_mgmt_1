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
            {
                'name': '總桿冠軍',
                'description': '總桿數最少者',
                'has_score': True,
                'has_rank': True,
                'max_winners': 1,
                'is_active': True
            },
            {
                'name': '淨桿冠軍',
                'description': '淨桿數最少者',
                'has_score': True,
                'has_rank': True,
                'max_winners': 1,
                'is_active': True
            },
            {
                'name': '淨桿亞軍',
                'description': '淨桿數第二少者',
                'has_score': True,
                'has_rank': True,
                'max_winners': 1,
                'is_active': True
            },
            {
                'name': '淨桿季軍',
                'description': '淨桿數第三少者',
                'has_score': True,
                'has_rank': True,
                'max_winners': 1,
                'is_active': True
            },
            {
                'name': '一桿進洞',
                'description': '一桿進洞者',
                'has_hole_number': True,
                'max_winners': None,
                'is_active': True
            },
            {
                'name': '最近洞獎',
                'description': '最接近洞口者',
                'has_hole_number': True,
                'max_winners': None,
                'is_active': True
            },
            {
                'name': '最遠洞獎',
                'description': '最遠距離進洞者',
                'has_hole_number': True,
                'max_winners': None,
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