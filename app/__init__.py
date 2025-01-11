from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import config

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)
    config.init_app(app)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from .api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app
