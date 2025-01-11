from app import create_app, db
from app.models import Tournament, Member
from datetime import datetime, date

app = create_app()

def add_test_data():
    with app.app_context():
        # 清除現有數據
        Tournament.query.delete()
        Member.query.delete()
        
        # 添加測試會員
        members = [
            Member(
                account='chang.san',
                chinese_name='張三',
                english_name='Chang San',
                department_class='資工系',
                member_number='M001',
                handicap=10.5
            ),
            Member(
                account='lee.si',
                chinese_name='李四',
                english_name='Lee Si',
                department_class='電機系',
                member_number='M002',
                handicap=15.2
            ),
            Member(
                account='wang.wu',
                chinese_name='王五',
                english_name='Wang Wu',
                department_class='機械系',
                member_number='M003',
                handicap=8.7
            )
        ]
        
        db.session.bulk_save_objects(members)
        db.session.commit()
        print('測試會員數據添加成功！')
        
        # 添加測試賽事
        tournaments = [
            Tournament(
                name='2025年1月月例賽',
                date=date(2025, 1, 15),
                location='台北球場',
                notes='第一次月例賽'
            ),
            Tournament(
                name='2025年2月月例賽',
                date=date(2025, 2, 15),
                location='林口球場',
                notes='第二次月例賽'
            ),
            Tournament(
                name='2025年春季盃',
                date=date(2025, 3, 1),
                location='大屯球場',
                notes='春季主要賽事'
            )
        ]
        
        db.session.bulk_save_objects(tournaments)
        db.session.commit()
        print('測試賽事數據添加成功！')

if __name__ == '__main__':
    add_test_data()
