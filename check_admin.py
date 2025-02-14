from app import create_app, db
from app.models import Member
import logging
import traceback
from sqlalchemy import text, inspect
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_admin():
    app = create_app()
    with app.app_context():
        try:
            # 記錄環境變數
            logger.info("環境變數:")
            logger.info(f"FLASK_ENV: {os.getenv('FLASK_ENV')}")
            logger.info(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
            logger.info(f"RENDER_POSTGRES_URL: {os.getenv('RENDER_POSTGRES_URL')}")
            
            # 記錄應用配置
            logger.info("應用配置:")
            logger.info(f"SQLALCHEMY_DATABASE_URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
            
            # 檢查資料庫連接
            logger.info("正在檢查資料庫連接...")
            try:
                result = db.session.execute(text('SELECT version()')).scalar()
                logger.info(f"資料庫版本: {result}")
                logger.info("資料庫連接正常")
            except Exception as e:
                logger.error(f"資料庫連接錯誤: {str(e)}")
                logger.error(traceback.format_exc())
                return
            
            # 檢查資料表
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            logger.info(f"資料庫中的表: {tables}")
            
            if 'member' not in tables:
                logger.error("member 表不存在！")
                return
            
            # 檢查 member 表結構
            columns = inspector.get_columns('member')
            logger.info("member 表結構:")
            for column in columns:
                logger.info(f"- {column['name']}: {column['type']}")
            
            # 檢查所有會員
            logger.info("正在查詢所有會員...")
            try:
                all_members = Member.query.all()
                logger.info(f"找到 {len(all_members)} 個會員")
                for member in all_members:
                    logger.info(f"會員資料: id={member.id}, account={member.account}, member_number={member.member_number}, name={member.chinese_name}, is_admin={member.is_admin}")
            except Exception as e:
                logger.error(f"查詢會員時發生錯誤: {str(e)}")
                logger.error(traceback.format_exc())
                return
            
            # 檢查管理員
            logger.info("正在查詢管理員帳號...")
            try:
                admin = Member.query.filter_by(is_admin=True).first()
                if admin:
                    logger.info("找到管理員帳號：")
                    logger.info(f"ID：{admin.id}")
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
                        logger.info("已創建預設管理員帳號")
                    except Exception as e:
                        logger.error(f"創建管理員帳號失敗：{str(e)}")
                        logger.error(traceback.format_exc())
                        db.session.rollback()
            except Exception as e:
                logger.error(f"檢查管理員時發生錯誤：{str(e)}")
                logger.error(traceback.format_exc())
                    
        except Exception as e:
            logger.error(f"檢查過程中發生錯誤：{str(e)}")
            logger.error(traceback.format_exc())

if __name__ == '__main__':
    check_admin() 