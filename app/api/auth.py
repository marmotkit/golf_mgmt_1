from flask import Blueprint, jsonify, request
from app.models import Member, db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import logging

bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@bp.route('/login', methods=['POST'])
def login():
    """登入端點"""
    try:
        data = request.get_json()
        
        if not data or 'account' not in data or 'member_number' not in data:
            return jsonify({
                'error': '請提供帳號和會員編號'
            }), 400
            
        account = data['account']
        member_number = data['member_number']
        
        # 查找會員
        member = Member.query.filter_by(
            account=account,
            member_number=member_number
        ).first()
        
        if not member:
            return jsonify({
                'error': '帳號或會員編號錯誤'
            }), 401
            
        # 創建 JWT token
        access_token = create_access_token(identity={
            'id': member.id,
            'account': member.account,
            'member_number': member.member_number,
            'chinese_name': member.chinese_name,
            'is_admin': member.is_admin
        })
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': member.id,
                'account': member.account,
                'member_number': member.member_number,
                'chinese_name': member.chinese_name,
                'is_admin': member.is_admin
            }
        })
        
    except Exception as e:
        logger.error(f"登入時發生錯誤: {str(e)}")
        return jsonify({
            'error': '登入失敗',
            'message': str(e)
        }), 500

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """獲取當前登入用戶信息"""
    try:
        current_user = get_jwt_identity()
        return jsonify(current_user)
    except Exception as e:
        logger.error(f"獲取用戶信息時發生錯誤: {str(e)}")
        return jsonify({
            'error': '獲取用戶信息失敗',
            'message': str(e)
        }), 500 