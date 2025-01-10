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
                    # 移除可能的時間部分
                    date_str = data['date'].split('T')[0]
                    current_app.logger.info(f"[from_dict] Converting date string: {date_str}")
                    try:
                        self.date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    except ValueError as e:
                        current_app.logger.error(f"[from_dict] Date conversion error: {str(e)}")
                        raise ValueError(f"Invalid date format. Expected 'YYYY-MM-DD', got '{date_str}'")
                elif isinstance(data['date'], datetime):
                    self.date = data['date'].date()
                else:
                    current_app.logger.error(f"[from_dict] Unsupported date type: {type(data['date'])}")
                    raise ValueError(f"Unsupported date type: {type(data['date'])}")
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
    member_number = db.Column(db.String(4))  # 會員編號：一位英文字母+最多3位數字
    full_name = db.Column(db.String(128))    # HOLE: 姓名全名
    chinese_name = db.Column(db.String(64))   # 姓名：中文姓名
    net_rank = db.Column(db.Integer)         # 淨桿名次
    gross_score = db.Column(db.Integer)      # 總桿數
    previous_handicap = db.Column(db.Float)   # 前次差點
    net_score = db.Column(db.Float)          # 淨桿桿數
    handicap_change = db.Column(db.Float)     # 差點新增
    new_handicap = db.Column(db.Float)       # 新差點
    points = db.Column(db.Integer)           # 積分
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """將成績數據轉換為字典格式"""
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'member_id': self.member_id,
            'member_number': self.member_number,
            'full_name': self.full_name,
            'chinese_name': self.chinese_name,
            'net_rank': self.net_rank,
            'gross_score': self.gross_score,
            'previous_handicap': round(self.previous_handicap, 2) if self.previous_handicap is not None else None,
            'net_score': round(self.net_score, 2) if self.net_score is not None else None,
            'handicap_change': round(self.handicap_change, 2) if self.handicap_change is not None else None,
            'new_handicap': round(self.new_handicap, 2) if self.new_handicap is not None else None,
            'points': self.points,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def from_dict(self, data):
        """從字典格式更新成績數據"""
        fields = ['member_number', 'full_name', 'chinese_name', 'net_rank', 
                 'gross_score', 'previous_handicap', 'net_score', 
                 'handicap_change', 'new_handicap', 'points']
        for field in fields:
            if field in data:
                setattr(self, field, data[field])

class MemberVersion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    version = db.Column(db.String(11), nullable=False)  # YYYYMMDDNNN 格式
    data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    member = db.relationship('Member', backref=db.backref('versions', lazy=True))
    
    def __repr__(self):
        return f'<MemberVersion {self.member_id}-{self.version}>'

class YearlyChampion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tournament_name = db.Column(db.String(128), nullable=False)
    player_name = db.Column(db.String(64), nullable=False)
    total_strokes = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'tournament_name': self.tournament_name,
            'player_name': self.player_name,
            'total_strokes': self.total_strokes,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def from_dict(data):
        return YearlyChampion(
            tournament_name=data.get('tournament_name'),
            player_name=data.get('player_name'),
            total_strokes=data.get('total_strokes'),
            date=datetime.fromisoformat(data.get('date')) if data.get('date') else datetime.utcnow()
        )
