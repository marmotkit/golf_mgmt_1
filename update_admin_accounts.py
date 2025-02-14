from app import create_app, db
from app.models import Member
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_admin_accounts():
    app = create_app()
    with app.app_context():
        try:
            # 查找所有管理員
            admins = Member.query.filter_by(is_admin=True).all()
            logger.info(f"找到 {len(admins)} 個管理員帳號")
            
            # 更新每個管理員的登入資訊
            for admin in admins:
                logger.info(f"更新管理員資訊: {admin.chinese_name}")
                logger.info(f"- 英文姓名: {admin.english_name}")
                logger.info(f"- 會員編號: {admin.member_number}")
            
            logger.info("管理員帳號更新完成")
            
            # 顯示所有管理員的登入資訊
            logger.info("\n管理員登入資訊：")
            for admin in admins:
                logger.info(f"管理員：{admin.chinese_name}")
                logger.info(f"- 登入帳號（英文姓名）：{admin.english_name}")
                logger.info(f"- 密碼（會員編號）：{admin.member_number}")
                logger.info("---")
            
        except Exception as e:
            logger.error(f"更新管理員帳號時發生錯誤：{str(e)}")
            raise

if __name__ == '__main__':
    update_admin_accounts() 