from datetime import datetime
from app import db

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
    location = db.Column(db.String(128))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
