from app import create_app, db
from flask_migrate import upgrade
from init_award_types import init_award_types
from sqlalchemy import inspect
from app.models import Member
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    app = create_app()
    with app.app_context():
        try:
            # 檢查表是否已存在
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            logger.info(f"現有的表: {existing_tables}")
            
            # 如果沒有任何表，才創建表
            if not existing_tables:
                logger.info("數據庫為空，開始創建表...")
                db.create_all()
                logger.info("數據庫表創建成功")
                
                # 執行所有待處理的遷移
                upgrade()
                logger.info("數據庫遷移完成")
                
                # 初始化獎項類型
                init_award_types()
                logger.info("獎項類型初始化完成")
            else:
                logger.info("數據庫表已存在，跳過初始化步驟")
            
            # 檢查管理員帳號
            logger.info("檢查管理員帳號...")
            admin = Member.query.filter_by(is_admin=True).first()
            if not admin:
                logger.info("未找到管理員帳號，創建預設管理員...")
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
                    logger.info("預設管理員帳號創建成功")
                except Exception as e:
                    logger.error(f"創建管理員帳號失敗: {str(e)}")
                    db.session.rollback()
            else:
                logger.info(f"找到管理員帳號: {admin.account}")
                
        except Exception as e:
            logger.error(f"初始化數據庫時發生錯誤: {str(e)}")
            raise

if __name__ == '__main__':
    init_db() 