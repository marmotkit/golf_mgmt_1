from app import create_app, db
from app.models import Member, Tournament

app = create_app()

def check_data():
    with app.app_context():
        print("\n=== 會員資料 ===")
        members = Member.query.all()
        for member in members:
            print(f"ID: {member.id}")
            print(f"帳號: {member.account}")
            print(f"中文名: {member.chinese_name}")
            print(f"英文名: {member.english_name}")
            print(f"系級: {member.department_class}")
            print(f"會員編號: {member.member_number}")
            print(f"差點: {member.handicap}")
            print("-" * 20)

        print("\n=== 賽事資料 ===")
        tournaments = Tournament.query.all()
        for tournament in tournaments:
            print(f"ID: {tournament.id}")
            print(f"名稱: {tournament.name}")
            print(f"日期: {tournament.date}")
            print(f"地點: {tournament.location}")
            print(f"備註: {tournament.notes}")
            print("-" * 20)

if __name__ == '__main__':
    check_data()
