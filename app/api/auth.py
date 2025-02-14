from flask import Blueprint, jsonify, request, current_app
from app.models import Member, db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import logging
import traceback

bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@bp.route('/login', methods=['POST'])
def login():
    """登入端點"""
    try:
        logger.info("開始處理登入請求")
        data = request.get_json()
        logger.info(f"收到的登入數據: {data}")
        
        if not data or 'account' not in data or 'member_number' not in data:
            logger.warning("登入數據不完整")
            return jsonify({
                'error': '請提供帳號和會員編號'
            }), 400
            
        english_name = data['account']  # 使用英文姓名作為帳號
        member_number = data['member_number']
        logger.info(f"嘗試登入 - 英文姓名: {english_name}, 會員編號: {member_number}")
        
        # 檢查資料庫連接
        try:
            db.session.execute(db.text('SELECT 1'))
            logger.info("資料庫連接正常")
        except Exception as e:
            logger.error(f"資料庫連接錯誤: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'error': '資料庫連接錯誤',
                'message': str(e)
            }), 500
        
        # 查找會員
        try:
            member = Member.query.filter_by(
                english_name=english_name,
                member_number=member_number
            ).first()
            
            if member:
                logger.info(f"找到會員: id={member.id}, name={member.chinese_name}, is_admin={member.is_admin}")
                
                # 檢查是否為管理員
                if not member.is_admin:
                    logger.warning(f"會員 {member.chinese_name} 不是管理員")
                    return jsonify({
                        'error': '您沒有管理員權限'
                    }), 403
                
                # 創建 JWT token
                identity = {
                    'id': member.id,
                    'account': member.english_name,
                    'member_number': member.member_number,
                    'chinese_name': member.chinese_name,
                    'is_admin': member.is_admin
                }
                logger.info(f"創建 JWT token，用戶身份: {identity}")
                
                access_token = create_access_token(identity=identity)
                logger.info("JWT token 創建成功")
                
                response_data = {
                    'access_token': access_token,
                    'user': identity
                }
                logger.info("登入成功，返回用戶數據")
                return jsonify(response_data)
            else:
                logger.warning(f"未找到會員 - 英文姓名: {english_name}, 會員編號: {member_number}")
                return jsonify({
                    'error': '帳號或會員編號錯誤'
                }), 401
            
        except Exception as e:
            logger.error(f"查詢會員時發生錯誤: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'error': '查詢會員失敗',
                'message': str(e)
            }), 500
        
    except Exception as e:
        logger.error(f"登入處理過程中發生錯誤: {str(e)}")
        logger.error(traceback.format_exc())
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