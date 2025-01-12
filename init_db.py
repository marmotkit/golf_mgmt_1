from app import create_app, db
from app.models import SystemConfig
from datetime import datetime
import os

app = create_app()

with app.app_context():
    # 打印資料庫連接信息
    print("使用的資料庫 URL:", app.config['SQLALCHEMY_DATABASE_URI'])
    print("環境變數 DATABASE_URL:", os.environ.get('DATABASE_URL'))
    
    # 確保表已創建
    db.create_all()
    print("資料庫表格已創建")
    
    # 檢查是否已存在版本信息
    version_config = SystemConfig.query.filter_by(key='version').first()
    if not version_config:
        # 添加版本信息
        version_config = SystemConfig(
            key='version',
            value='V2.6',
            updated_at=datetime.utcnow()
        )
        db.session.add(version_config)
        print("添加版本信息")
    
    # 檢查是否已存在版本描述
    version_desc = SystemConfig.query.filter_by(key='version_description').first()
    if not version_desc:
        # 添加版本描述
        version_desc = SystemConfig(
            key='version_description',
            value='完成報表分析功能，包含團隊平均差點、團隊平均總桿數、前10名總積分(加總)、前10名總桿數(平均)和前5名最佳進步獎',
            updated_at=datetime.utcnow()
        )
        db.session.add(version_desc)
        print("添加版本描述")
    
    # 提交更改
    db.session.commit()
    print("資料庫初始化成功!")
