from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
import pandas as pd
import os
from app import db
from app.models import Member, MemberVersion
import logging
import traceback
from datetime import datetime
from sqlalchemy import func
from sqlalchemy import Boolean

bp = Blueprint('members', __name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def ensure_upload_dir():
    upload_dir = current_app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    return upload_dir

def generate_version_number():
    """生成新的版本號"""
    try:
        # 獲取最新版本號
        latest_version = db.session.query(MemberVersion.version)\
            .order_by(MemberVersion.version.desc())\
            .first()
        
        if latest_version:
            current_version = latest_version[0]
        else:
            # 如果沒有任何版本，從202501060001開始
            current_date = datetime.now().strftime('%Y%m%d')
            current_version = int(f"{current_date}0001")
            
        # 生成新版本號
        date_part = str(current_version)[:8]  # 取出日期部分
        current_date = datetime.now().strftime('%Y%m%d')
        
        if date_part == current_date:
            # 如果是同一天，序號加1
            sequence = int(str(current_version)[8:]) + 1
        else:
            # 如果是新的一天，序號重置為1
            sequence = 1
            
        new_version = int(f"{current_date}{sequence:04d}")
        logger.info(f'Generated new version number: {new_version} (current: {current_version})')
        return new_version
        
    except Exception as e:
        logger.error(f'Error generating version number: {str(e)}')
        logger.error(traceback.format_exc())
        raise

def process_excel_data(df):
    """
    處理 Excel 資料並創建新版本
    每次上傳都會創建新版本，不會覆蓋原有資料
    """
    success_count = 0
    error_messages = []
    
    try:
        # 記錄 DataFrame 信息
        logger.info(f'DataFrame info: {df.info()}')
        logger.info(f'DataFrame columns: {df.columns.tolist()}')
        logger.info(f'DataFrame shape: {df.shape}')
        
        # 第一步：驗證所有資料
        required_columns = ['帳號', '中文姓名', '會員編號', '會員類型', '是否為管理員']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logger.error(f'Missing columns: {missing_columns}')
            return 0, [f'缺少必要欄位: {", ".join(missing_columns)}']

        # 檢查是否有重複的會員編號
        member_numbers = df['會員編號'].dropna().astype(str).tolist()
        if len(member_numbers) != len(set(member_numbers)):
            logger.error('Duplicate member numbers found')
            return 0, ['Excel 檔案中包含重複的會員編號']

        # 第二步：開始資料庫事務
        version_number = generate_version_number()
        logger.info(f'Starting transaction with version: {version_number}')
        
        # 第三步：處理每一行資料
        new_members = []
        version_records = []
        row_errors = []
        
        for index, row in df.iterrows():
            try:
                logger.info(f'Processing row {index + 1}: {row.to_dict()}')
                
                # 檢查並清理資料
                account = str(row['帳號']).strip() if pd.notna(row['帳號']) else None
                chinese_name = str(row['中文姓名']).strip() if pd.notna(row['中文姓名']) else None
                english_name = str(row['英文姓名']).strip() if pd.notna(row['英文姓名']) else None
                department_class = str(row['系級']).strip() if pd.notna(row['系級']) else None
                member_number = str(row['會員編號']).strip() if pd.notna(row['會員編號']) else None
                is_guest = str(row['會員類型']).strip() == '來賓' if pd.notna(row['會員類型']) else False
                is_admin = str(row['是否為管理員']).strip() in ['是', '1', 'True', 'true'] if pd.notna(row['是否為管理員']) else False
                handicap = float(row['差點']) if pd.notna(row['差點']) else None
                
                # 記錄處理後的資料
                member_data = {
                    'account': account,
                    'chinese_name': chinese_name,
                    'english_name': english_name,
                    'department_class': department_class,
                    'member_number': member_number,
                    'is_guest': is_guest,
                    'is_admin': is_admin,
                    'handicap': handicap
                }
                logger.info(f'Processed data: {member_data}')

                # 檢查必要欄位是否有值
                if not member_number or not account or not chinese_name:
                    error_msg = f"第 {index + 2} 行資料驗證失敗: 會員編號({member_number})、帳號({account})和中文姓名({chinese_name})為必填欄位"
                    logger.error(error_msg)
                    row_errors.append(error_msg)
                    continue

                # 查找或創建會員記錄
                member = Member.query.filter_by(member_number=member_number).first()
                if not member:
                    logger.info(f'Creating new member: {member_number}')
                    member = Member(**member_data)
                    new_members.append(member)
                    db.session.add(member)
                    db.session.flush()  # 獲取 member.id
                else:
                    logger.info(f'Updating existing member: {member_number}')
                    # 更新現有會員資料
                    for key, value in member_data.items():
                        setattr(member, key, value)

                # 創建版本記錄
                version = MemberVersion(
                    member_id=member.id,
                    version=version_number,
                    data=member_data,
                    created_at=datetime.now()
                )
                version_records.append(version)
                success_count += 1
                logger.info(f'Successfully processed member: {member_number}')
                
            except Exception as e:
                error_msg = f"第 {index + 2} 行資料處理失敗: {str(e)}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                row_errors.append(error_msg)

        # 如果有成功處理的資料，就提交
        if success_count > 0:
            logger.info(f'Committing {success_count} members to version {version_number}')
            try:
                # 批次添加版本記錄
                for version in version_records:
                    db.session.add(version)
                    logger.info(f'Adding version record for member {version.member_id}')

                # 提交所有更改
                db.session.commit()
                logger.info(f'Successfully committed version {version_number} with {success_count} members')
            except Exception as e:
                db.session.rollback()
                error_msg = f"資料庫提交失敗: {str(e)}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                return 0, [error_msg]
            
            # 將行錯誤添加到錯誤訊息中
            error_messages.extend(row_errors)
            
        else:
            db.session.rollback()
            logger.error('No successful records to commit')
            error_messages.extend(row_errors)
            return 0, error_messages

    except Exception as e:
        db.session.rollback()
        error_msg = f"資料庫錯誤: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return 0, [error_msg]
        
    return success_count, error_messages

def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    if isinstance(value, int):
        return bool(value)
    return False

@bp.route('/', methods=['GET'])
def get_members():
    """獲取會員列表"""
    try:
        # 從查詢參數中獲取版本號，如果沒有指定則使用最新版本
        version = request.args.get('version')
        
        # 獲取最新版本號
        latest_version = db.session.query(MemberVersion.version)\
            .order_by(MemberVersion.version.desc())\
            .first()
            
        if not version and latest_version:
            version = latest_version[0]
        elif not latest_version:
            logger.warning('No member versions found in database')
            return jsonify([])
            
        logger.info(f'Fetching members for version: {version}')
        
        # 使用指定版本號獲取會員資料
        members_data = db.session.query(
            Member,
            MemberVersion.data
        ).join(
            MemberVersion,
            Member.id == MemberVersion.member_id
        ).filter(
            MemberVersion.version == version
        ).all()

        # 整理會員資料
        result = []
        for member, version_data in members_data:
            try:
                member_dict = {
                    'id': member.id,
                    'account': member.account,
                    'chinese_name': member.chinese_name,
                    'english_name': member.english_name,
                    'department_class': member.department_class,
                    'member_number': member.member_number,
                    'is_guest': member.is_guest,
                    'is_admin': member.is_admin,
                    'handicap': float(version_data.get('handicap')) if version_data and version_data.get('handicap') is not None else None
                }
                result.append(member_dict)
            except Exception as e:
                logger.error(f'Error processing member {member.id}: {str(e)}')
                continue

        logger.info(f'Found {len(result)} members for version {version}')
        return jsonify(result)

    except Exception as e:
        logger.error(f'Error getting members: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/upload', methods=['POST'])
def upload_members():
    logger.info('File upload request received')
    logger.info(f'Request files: {request.files}')
    logger.info(f'Request form: {request.form}')
    
    try:
        if 'file' not in request.files:
            logger.error('No file in request')
            return jsonify({
                'error': '未提供檔案',
                'error_messages': ['請選擇要上傳的 Excel 檔案'],
                'success_count': 0
            }), 400
            
        file = request.files['file']
        logger.info(f'Received file: {file.filename}')
        
        if file.filename == '':
            logger.error('Empty filename')
            return jsonify({
                'error': '未選擇檔案',
                'error_messages': ['請選擇要上傳的 Excel 檔案'],
                'success_count': 0
            }), 400
            
        if not file.filename.endswith('.xlsx'):
            logger.error('Invalid file type')
            return jsonify({
                'error': '檔案格式錯誤',
                'error_messages': ['只允許上傳 .xlsx 格式的檔案'],
                'success_count': 0
            }), 400

        # Ensure upload directory exists
        upload_dir = ensure_upload_dir()
        logger.info(f'Upload directory: {upload_dir}')
        
        # Save file with secure filename
        filename = secure_filename(file.filename)
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        logger.info(f'File saved to: {filepath}')
        
        # Read Excel file
        try:
            logger.info('Reading Excel file...')
            df = pd.read_excel(filepath, dtype=str)  # 先將所有欄位讀取為字符串
            logger.info(f'Excel file read successfully: {len(df)} rows')
            logger.info(f'Columns: {df.columns.tolist()}')
            logger.info(f'First row: {df.iloc[0].to_dict() if len(df) > 0 else "No data"}')
            
            # 檢查是否為空檔案
            if len(df) == 0:
                logger.error('Empty Excel file')
                return jsonify({
                    'error': 'Excel 檔案為空',
                    'error_messages': ['上傳的 Excel 檔案沒有任何資料'],
                    'success_count': 0
                }), 400
                
        except Exception as e:
            logger.error(f'Error reading Excel file: {str(e)}')
            logger.error(traceback.format_exc())
            return jsonify({
                'error': 'Excel 檔案讀取失敗',
                'error_messages': [str(e)],
                'success_count': 0
            }), 400
        
        # Process data
        try:
            logger.info('Processing Excel data...')
            success_count, error_messages = process_excel_data(df)
            logger.info(f'Data processed. Success: {success_count}, Errors: {len(error_messages)}')
            
            if success_count == 0 and error_messages:
                logger.error(f'No records processed successfully. Errors: {error_messages}')
                return jsonify({
                    'error': '資料處理失敗',
                    'error_messages': error_messages,
                    'success_count': 0
                }), 400
                
            return jsonify([success_count, error_messages])
            
        except Exception as e:
            logger.error(f'Error processing data: {str(e)}')
            logger.error(traceback.format_exc())
            return jsonify({
                'error': '部分資料處理失敗，請檢查錯誤訊息',
                'error_messages': [str(e)],
                'success_count': 0
            }), 400
            
    except Exception as e:
        logger.error(f'Unexpected error in upload: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({
            'error': '檔案上傳失敗',
            'error_messages': [str(e)],
            'success_count': 0
        }), 500

@bp.route('/batch-delete', methods=['POST'])
def batch_delete_members():
    logger.info('Batch delete request received')
    data = request.get_json()
    if not data or 'ids' not in data:
        logger.error('No member IDs provided')
        return jsonify({'error': 'No member IDs provided'}), 400
        
    member_ids = data['ids']
    deleted_count = 0
    error_ids = []
    
    for member_id in member_ids:
        try:
            member = Member.query.get(member_id)
            if member:
                db.session.delete(member)
                deleted_count += 1
        except Exception as e:
            logger.error(f'Error deleting member {member_id}: {str(e)}')
            logger.error(traceback.format_exc())
            error_ids.append({
                'id': member_id,
                'error': str(e)
            })
    
    db.session.commit()
    logger.info(f'Deletion completed: {deleted_count} members deleted successfully')
    
    return jsonify({
        'deleted_count': deleted_count,
        'error_count': len(error_ids),
        'errors': error_ids
    })

@bp.route('/', methods=['POST'])
def create_member():
    logger.info('Create member request received')
    data = request.get_json()
    try:
        member = Member(
            account=data['account'],
            chinese_name=data['chinese_name'],
            english_name=data.get('english_name'),
            department_class=data.get('department_class'),
            member_number=data.get('member_number'),
            is_guest=data.get('is_guest', False),
            is_admin=data.get('is_admin', False),
            handicap=data.get('handicap')
        )
        db.session.add(member)
        
        # Create initial version
        version = MemberVersion(
            member=member,
            version=generate_version_number(),
            data=data,
            created_at=datetime.now()
        )
        db.session.add(version)
        
        db.session.commit()
        logger.info(f'Member created: {member.id}')
        return jsonify({'id': member.id}), 201
    except Exception as e:
        logger.error(f'Error creating member: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Error creating member: {str(e)}'}), 400

@bp.route('/<int:member_id>', methods=['PUT', 'PATCH'])
def update_member(member_id):
    try:
        data = request.get_json()
        logger.info(f'Received update request for member {member_id}')
        logger.info(f'Request data: {data}')
        
        if data is None:
            logger.error('No JSON data received')
            return jsonify({'error': '無效的請求數據'}), 400
            
        member = Member.query.get(member_id)
        if not member:
            logger.error(f'Member {member_id} not found')
            return jsonify({'error': f'找不到會員 ID {member_id}'}), 404
            
        logger.info(f'Found member: {member.member_number}')
        logger.info(f'Current member data: {member.to_dict()}')
        
        # 移除 id 欄位，避免嘗試更新主鍵
        if 'id' in data:
            del data['id']
            
        try:
            # 更新會員資料
            if 'member_number' in data:
                if str(data['member_number']) != str(member.member_number):
                    existing = Member.query.filter_by(member_number=str(data['member_number'])).first()
                    if existing and existing.id != member_id:
                        return jsonify({'error': f"會員編號 {data['member_number']} 已存在"}), 400
                member.member_number = str(data['member_number'])
                
            if 'account' in data:
                member.account = str(data['account'])
                
            if 'chinese_name' in data:
                member.chinese_name = str(data['chinese_name'])
                
            if 'english_name' in data:
                member.english_name = str(data['english_name'])
                
            if 'department_class' in data:
                member.department_class = str(data['department_class'])
                
            if 'is_guest' in data:
                member.is_guest = bool(data['is_guest'])
                
            if 'is_admin' in data:
                member.is_admin = bool(data['is_admin'])
                
            if 'handicap' in data:
                try:
                    handicap_value = data['handicap']
                    logger.info(f'Processing handicap value: {handicap_value} (type: {type(handicap_value)})')
                    if handicap_value is None or handicap_value == '':
                        member.handicap = None
                        logger.info('Setting handicap to None')
                    else:
                        try:
                            member.handicap = float(handicap_value)
                            logger.info(f'Setting handicap to {member.handicap}')
                        except (ValueError, TypeError) as e:
                            logger.error(f'Failed to convert handicap to float: {str(e)}')
                            return jsonify({'error': f'差點必須是數字，收到的值為: {handicap_value}'}), 400
                except Exception as e:
                    logger.error(f'Error processing handicap: {str(e)}')
                    logger.error(traceback.format_exc())
                    return jsonify({'error': f'處理差點時發生錯誤: {str(e)}'}), 400
            
            # 創建新版本
            try:
                member_data = member.to_dict()
                version_data = {k: v for k, v in member_data.items() if k not in ['created_at', 'updated_at']}
                
                version_number = generate_version_number()
                logger.info(f'Generated version number: {version_number}')
                logger.info(f'Version data: {version_data}')
                
                version = MemberVersion(
                    member=member,
                    version=version_number,
                    data=version_data,
                    created_at=datetime.now()
                )
                db.session.add(version)
                
                logger.info('Committing changes to database')
                db.session.commit()
                logger.info(f'Successfully updated member {member_id}')
                return jsonify({
                    'message': '更新成功',
                    'data': version_data
                })
            except Exception as e:
                logger.error(f'Error creating version: {str(e)}')
                logger.error(traceback.format_exc())
                db.session.rollback()
                return jsonify({'error': f'創建版本失敗: {str(e)}'}), 400
            
        except Exception as e:
            db.session.rollback()
            logger.error(f'Database error while updating: {str(e)}')
            logger.error(traceback.format_exc())
            return jsonify({'error': f'資料庫更新失敗: {str(e)}'}), 400
            
    except Exception as e:
        logger.error(f"更新會員失敗: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'])
def delete_member(id):
    try:
        member = Member.query.get_or_404(id)
        db.session.delete(member)
        db.session.commit()
        return jsonify({'message': '刪除成功'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"刪除會員失敗: {str(e)}")
        return jsonify({'error': str(e)}), 400

@bp.route('/versions/<int:id>', methods=['GET'])
def get_member_versions(id):
    logger.info(f'Get member versions request received for member {id}')
    versions = MemberVersion.query.filter_by(member_id=id).order_by(
        MemberVersion.version.desc()).all()
    return jsonify([{
        'version': v.version,
        'data': v.data,
        'created_at': v.created_at
    } for v in versions])

@bp.route('/compare', methods=['POST'])
def compare_versions():
    """比較兩個版本的差異"""
    try:
        data = request.get_json()
        from_version = data.get('from')  # 舊版本
        to_version = data.get('to')      # 新版本

        if not from_version or not to_version:
            return jsonify({'error': '請提供要比較的版本號'}), 400

        # 獲取兩個版本的會員資料
        old_data = db.session.query(
            Member.member_number,
            Member.chinese_name,
            MemberVersion.data
        ).join(
            MemberVersion,
            Member.id == MemberVersion.member_id
        ).filter(
            MemberVersion.version == from_version
        ).all()

        new_data = db.session.query(
            Member.member_number,
            Member.chinese_name,
            MemberVersion.data
        ).join(
            MemberVersion,
            Member.id == MemberVersion.member_id
        ).filter(
            MemberVersion.version == to_version
        ).all()

        # 將資料轉換為字典格式，方便比較
        old_dict = {m.member_number: m.data for m in old_data}
        new_dict = {m.member_number: m.data for m in new_data}

        # 比較差異
        differences = []
        all_members = set(old_dict.keys()) | set(new_dict.keys())

        for member_number in all_members:
            old_member_data = old_dict.get(member_number, {})
            new_member_data = new_dict.get(member_number, {})

            # 比較所有欄位
            for field in ['handicap', 'is_guest', 'is_admin', 'chinese_name', 'english_name', 'department_class']:
                old_value = old_member_data.get(field)
                new_value = new_member_data.get(field)

                if old_value != new_value:
                    # 找到對應的會員姓名
                    member_name = next(
                        (m.chinese_name for m in old_data if m.member_number == member_number),
                        next(
                            (m.chinese_name for m in new_data if m.member_number == member_number),
                            None
                        )
                    )

                    differences.append({
                        'member_number': member_number,
                        'name': member_name,
                        'field': field,
                        'old': old_value,
                        'new': new_value
                    })

        logger.info(f'Found {len(differences)} differences between versions {from_version} and {to_version}')
        return jsonify(differences)

    except Exception as e:
        logger.error(f'Error comparing versions: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/versions', methods=['GET'])
def get_all_versions():
    """獲取所有版本列表"""
    try:
        # 獲取所有不重複的版本號，按版本號降序排序
        versions = db.session.query(MemberVersion.version)\
            .distinct()\
            .order_by(MemberVersion.version.desc())\
            .all()
        
        # 獲取每個版本的會員數量
        version_info = []
        for (version,) in versions:
            try:
                # 計算該版本的會員數量
                member_count = db.session.query(func.count(MemberVersion.id))\
                    .filter(MemberVersion.version == version)\
                    .scalar()
                
                # 獲取該版本的創建時間
                created_at = db.session.query(MemberVersion.created_at)\
                    .filter(MemberVersion.version == version)\
                    .order_by(MemberVersion.created_at.asc())\
                    .first()
                
                version_info.append({
                    'version': str(version),
                    'member_count': member_count,
                    'created_at': created_at[0].isoformat() if created_at else None
                })
            except Exception as e:
                logger.error(f'Error processing version {version}: {str(e)}')
                continue
        
        logger.info(f'Found {len(version_info)} versions')
        return jsonify(version_info)
        
    except Exception as e:
        logger.error(f'Error getting versions: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/compare-versions', methods=['POST'])
def compare_member_versions():
    """比較單一會員的兩個版本"""
    logger.info('Compare member versions request received')
    data = request.get_json()
    try:
        version1 = MemberVersion.query.filter_by(
            member_id=data['member_id'], 
            version=data['version1']
        ).first_or_404()
        version2 = MemberVersion.query.filter_by(
            member_id=data['member_id'], 
            version=data['version2']
        ).first_or_404()
        
        # Compare the two versions and return differences
        differences = {}
        fields = ['account', 'chinese_name', 'english_name', 'department_class',
                  'member_number', 'is_guest', 'is_admin', 'handicap']
                  
        for field in fields:
            value1 = version1.data.get(field)
            value2 = version2.data.get(field)

            if value1 != value2:
                # 找到對應的會員姓名
                member_name = next(
                    (m.chinese_name for m in Member.query.filter_by(id=data['member_id']).all()),
                    None
                )

                differences[field] = {
                    'old': value1,
                    'new': value2
                }
        
        logger.info(f'Versions compared: {data["member_id"]}, version {version1.version} and version {version2.version}')
        return jsonify({
            'member_id': data['member_id'],
            'version1': version1.version,
            'version2': version2.version,
            'version1_date': version1.created_at,
            'version2_date': version2.created_at,
            'differences': differences
        })
    except Exception as e:
        logger.error(f'Error comparing versions: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Error comparing versions: {str(e)}'}), 400

@bp.route('/versions/<version>', methods=['DELETE'])
def delete_version(version):
    """刪除指定版本的會員資料。只能刪除非最新版本。"""
    try:
        logger.info(f'收到刪除版本請求: {version}, 類型: {type(version)}')
        
        # 檢查是否為最新版本
        latest_version = db.session.query(MemberVersion.version)\
            .order_by(MemberVersion.version.desc())\
            .first()
            
        if not latest_version:
            logger.error('找不到任何版本')
            return jsonify({'error': '找不到任何版本'}), 404
            
        latest_version_str = str(latest_version[0])
        version_str = str(version)
        
        logger.info(f'最新版本: {latest_version_str}, 要刪除的版本: {version_str}')
        logger.info(f'版本比較結果: {version_str == latest_version_str}')
        
        # 檢查版本是否存在
        version_exists = db.session.query(MemberVersion)\
            .filter(MemberVersion.version == version_str)\
            .first()
            
        if not version_exists:
            logger.error(f'找不到要刪除的版本: {version_str}')
            return jsonify({'error': f'找不到版本 {version_str}'}), 404
            
        # 最新版本不能刪除，其他版本都可以刪除
        if str(latest_version[0]) == version_str:
            logger.error(f'嘗試刪除最新版本被拒絕: {version_str}')
            return jsonify({'error': '不能刪除最新版本'}), 400
        
        # 執行刪除
        logger.info(f'開始執行刪除操作: {version_str}')
        deleted_count = db.session.query(MemberVersion)\
            .filter(MemberVersion.version == version_str)\
            .delete()
            
        db.session.commit()
        logger.info(f'成功刪除版本 {version_str}，共刪除 {deleted_count} 筆記錄')
        return jsonify({'message': f'成功刪除版本 {version_str}'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'刪除版本時發生異常: {str(e)}')
        logger.error(f'異常類型: {type(e)}')
        logger.error(f'完整異常追蹤: {traceback.format_exc()}')
        return jsonify({'error': str(e)}), 500

@bp.route('/clear', methods=['POST'])
def clear_members():
    try:
        # 先清除所有版本記錄
        MemberVersion.query.delete()
        # 再清除所有會員記錄
        Member.query.delete()
        db.session.commit()
        return jsonify({'message': '已清除所有會員資料和版本記錄'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error clearing members: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/count', methods=['GET'])
def get_member_count():
    """獲取最新版本的會員總數（不含來賓）"""
    try:
        # 獲取最新版本號
        latest_version_query = db.session.query(MemberVersion.version)\
            .order_by(MemberVersion.version.desc())\
            .first()
        
        if not latest_version_query:
            logger.warning("No versions found")
            return jsonify({'count': 0})
        
        latest_version = latest_version_query[0]    
        logger.info(f"Latest version found: {latest_version}")
        
        # 先獲取最新版本的所有會員資料
        members = db.session.query(Member)\
            .join(MemberVersion, Member.id == MemberVersion.member_id)\
            .filter(MemberVersion.version == latest_version)\
            .all()
        
        # 手動過濾非來賓會員
        non_guest_count = 0
        for member in members:
            # 獲取該會員在最新版本的資料
            version_data = db.session.query(MemberVersion)\
                .filter(
                    MemberVersion.member_id == member.id,
                    MemberVersion.version == latest_version
                ).first()
            
            if version_data:
                member_data = version_data.data
                is_guest = member_data.get('is_guest', False)
                if not is_guest:
                    non_guest_count += 1
                logger.debug(f"Member {member.id}: is_guest = {is_guest}")
            
        logger.info(f"Found {non_guest_count} non-guest members in version {latest_version}")
        return jsonify({'count': non_guest_count})
        
    except Exception as e:
        logger.error(f"獲取會員總數失敗: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/count', methods=['GET'])
def get_members_count():
    try:
        count = Member.query.count()
        return jsonify({'count': count})
    except Exception as e:
        current_app.logger.error(f"Error getting member count: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Failed to get member count',
            'details': str(e)
        }), 500

@bp.route('/average-handicap', methods=['GET'])
def get_average_handicap():
    try:
        result = db.session.query(db.func.avg(Member.handicap)).filter(Member.handicap != None).scalar()
        average_handicap = float(result) if result is not None else 0
        return jsonify({'averageHandicap': round(average_handicap, 1)})
    except Exception as e:
        current_app.logger.error(f"Error calculating average handicap: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Failed to calculate average handicap',
            'details': str(e)
        }), 500
