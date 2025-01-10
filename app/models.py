from datetime import datetime
from app import db
import json

class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account = db.Column(db.String(64), unique=True, nullable=False)
    chinese_name = db.Column(db.String(64), nullable=False)
    english_name = db.Column(db.String(64))
    department_class = db.Column(db.String(64))  # 系級
    member_number = db.Column(db.String(32), unique=True)
    is_guest = db.Column(db.Boolean, default=False)  # 會員/來賓
    is_admin = db.Column(db.Boolean, default=False)
    handicap = db.Column(db.Float)  # 最新差點
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """將會員數據轉換為字典格式"""
        return {
            'id': self.id,
            'account': str(self.account) if self.account else None,
            'chinese_name': str(self.chinese_name) if self.chinese_name else None,
            'english_name': str(self.english_name) if self.english_name else None,
            'department_class': str(self.department_class) if self.department_class else None,
            'member_number': str(self.member_number) if self.member_number else None,
            'is_guest': bool(self.is_guest),
            'is_admin': bool(self.is_admin),
            'handicap': float(self.handicap) if self.handicap is not None else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Tournament(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(128), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """將賽事數據轉換為字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'date': self.date.strftime('%Y-%m-%d'),
            'location': self.location,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def from_dict(self, data):
        """從字典格式更新賽事數據"""
        from flask import current_app
        
        # 记录输入数据
        current_app.logger.info(f"[from_dict] Start processing data: {json.dumps(data, ensure_ascii=False)}")
        
        # 处理基本字段
        for field in ['name', 'location', 'notes']:
            if field in data:
                current_app.logger.info(f"[from_dict] Setting {field} = {data[field]}")
                setattr(self, field, data[field])
        
        # 处理日期
        if 'date' in data:
            try:
                current_app.logger.info(f"[from_dict] Processing date: {data['date']}")
                if isinstance(data['date'], str):
                    current_app.logger.info(f"[from_dict] Converting date string: {data['date']}")
                    try:
                        self.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
                    except ValueError as e:
                        current_app.logger.error(f"[from_dict] Date conversion error: {str(e)}")
                        raise ValueError(f"Invalid date format. Expected 'YYYY-MM-DD', got '{data['date']}'")
                else:
                    current_app.logger.info(f"[from_dict] Using date object directly: {data['date']}")
                    self.date = data['date']
                current_app.logger.info(f"[from_dict] Date set successfully to: {self.date}")
            except Exception as e:
                current_app.logger.error(f"[from_dict] Unexpected error processing date: {str(e)}")
                raise
        
        # 记录最终状态
        current_app.logger.info(f"[from_dict] Final object state: name={self.name}, date={self.date}, location={self.location}, notes={self.notes}")

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournament.id'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    gross_score = db.Column(db.Integer, nullable=False)  # 總桿
    net_score = db.Column(db.Float)  # 淨桿
    points = db.Column(db.Integer)  # 積分
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    tournament = db.relationship('Tournament', backref='scores')
    member = db.relationship('Member', backref='scores')

class MemberVersion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    version = db.Column(db.String(11), nullable=False)  # YYYYMMDDNNN 格式
    data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    member = db.relationship('Member', backref=db.backref('versions', lazy=True))
    
    def __repr__(self):
        return f'<MemberVersion {self.member_id}-{self.version}>'
