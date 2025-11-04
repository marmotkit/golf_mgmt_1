from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from app.api import members, tournaments, scores, games, reports, dashboard, awards
    app.register_blueprint(members.bp, url_prefix='/api', name='members_api')
    app.register_blueprint(tournaments.bp, url_prefix='/api', name='tournaments_api')
    app.register_blueprint(scores.bp, url_prefix='/api', name='scores_api')
    app.register_blueprint(games.bp, url_prefix='/api', name='games_api')
    app.register_blueprint(reports.bp, url_prefix='/api/reports', name='reports_api')
    app.register_blueprint(dashboard.bp, url_prefix='/api', name='dashboard_api')
    app.register_blueprint(awards.bp, url_prefix='/api', name='awards_api')

    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}

    return app
