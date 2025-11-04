import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'temp')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    @staticmethod
    def init_app(app):
        pass

    def __init__(self):
        if 'DATABASE_URL' in os.environ:
            self.SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
            if self.SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
                self.SQLALCHEMY_DATABASE_URI = self.SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
        else:
            self.SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')

config = Config()
