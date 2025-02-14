from app import create_app, db
from app.models import Member
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_admin():
    app = create_app()
    with app.app_context():
        try:
            # 檢查資料庫連接
            logger.info("正在檢查資料庫連接...")
            db.session.execute(db.text('SELECT 1'))
            logger.info("資料庫連接正常")
            
            # 檢查所有會員
            logger.info("正在查詢所有會員...")
            all_members = Member.query.all()
            logger.info(f"找到 {len(all_members)} 個會員")
            for member in all_members:
                logger.info(f"會員資料: account={member.account}, member_number={member.member_number}, name={member.chinese_name}, is_admin={member.is_admin}")
            
            # 檢查管理員
            logger.info("正在查詢管理員帳號...")
            admin = Member.query.filter_by(is_admin=True).first()
            if admin:
                logger.info("找到管理員帳號：")
                logger.info(f"帳號：{admin.account}")
                logger.info(f"會員編號：{admin.member_number}")
                logger.info(f"姓名：{admin.chinese_name}")
            else:
                logger.info("找不到管理員帳號，正在創建...")
                # 創建一個預設管理員帳號
                default_admin = Member(
                    account="admin",
                    member_number="A001",
                    chinese_name="系統管理員",
                    is_admin=True,
                    english_name="Admin",
                    department_class="ADMIN",
                    gender="M"
                )
                try:
                    db.session.add(default_admin)
                    db.session.commit()
                    logger.info("已創建預設管理員帳號：")
                    logger.info("帳號：admin")
                    logger.info("會員編號：A001")
                except Exception as e:
                    logger.error(f"創建管理員帳號失敗：{str(e)}")
                    db.session.rollback()
                    
        except Exception as e:
            logger.error(f"檢查過程中發生錯誤：{str(e)}")
            raise

if __name__ == '__main__':
    check_admin() 