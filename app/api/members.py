from flask import Blueprint, jsonify, request, current_app, send_file
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
import io
from io import BytesIO

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
            # 如果沒有任何版本，從2025010601開始
            current_date = datetime.now().strftime('%Y%m%d')
            current_version = int(f"{current_date}01")
            
        # 生成新版本號
        date_part = str(current_version)[:8]  # 取出日期部分
        current_date = datetime.now().strftime('%Y%m%d')
        
        if date_part == current_date:
            # 如果是同一天，序號加1
            sequence = int(str(current_version)[8:]) + 1
        else:
            # 如果是新的一天，序號重置為1
            sequence = 1
            
        new_version = int(f"{current_date}{sequence:02d}")  # 確保不超過11字符
        logger.info(f'Generated new version number: {new_version} (current: {current_version})')
        return new_version
        
    except Exception as e:
        logger.error(f'Error generating version number: {str(e)}')
        logger.error(traceback.format_exc())
        raise

def process_excel_data(df):
    """處理上傳的 Excel 資料"""
    try:
        # 檢查必要欄位是否存在
        required_columns = {
            '會員編號': ['會員編號', '會員號碼'],
            '會員類型': ['會員類型', '類型'],
            '帳號': ['帳號', '帳戶', 'account'],
            '是否為管理員': ['是否為管理員', '管理員'],
            '性別': ['性別', 'gender']
        }

        # 檢查每個必要欄位
        column_mapping = {}
        missing_columns = []
        available_columns = df.columns.tolist()
        
        logger.info(f'Excel檔案中的欄位：{available_columns}')
        
        for required_col, possible_names in required_columns.items():
            found = False
            for name in possible_names:
                if name in df.columns:
                    column_mapping[required_col] = name
                    found = True
                    break
            if not found:
                missing_columns.append(required_col)

        if missing_columns:
            error_msg = f'缺少必要欄位：{", ".join(missing_columns)}\n可用的欄位：{", ".join(available_columns)}'
            logger.error(error_msg)
            raise ValueError(error_msg)

        # 重命名欄位以統一處理
        df = df.rename(columns={v: k for k, v in column_mapping.items()})

        # 清理數據：移除前後空格，將 '(null)' 轉換為空字串
        for col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.strip()
                df[col] = df[col].replace(['(null)', 'null', 'nan', 'None', ''], '')

        # 驗證每一行數據
        errors = []
        valid_rows = []
        
        for idx, row in df.iterrows():
            try:
                row_errors = []
                row_data = row.to_dict()
                
                # 檢查必填欄位是否為空
                empty_fields = []
                for col in required_columns.keys():
                    if pd.isna(row[col]) or str(row[col]).strip() == '':
                        empty_fields.append(col)
                
                if empty_fields:
                    row_errors.append(f'第 {idx + 2} 行：必填欄位為空：{", ".join(empty_fields)}')

                # 驗證會員編號格式
                member_number = str(row['會員編號']).strip()
                if len(member_number) == 0:
                    row_errors.append(f'第 {idx + 2} 行：會員編號不能為空')
                elif len(member_number) > 10:
                    row_errors.append(f'第 {idx + 2} 行：會員編號長度不能超過10個字符：{member_number}')

                # 驗證會員類型
                member_type = str(row['會員類型']).strip()
                if member_type and member_type not in ['會員', '來賓']:
                    row_errors.append(f'第 {idx + 2} 行：會員類型必須是「會員」或「來賓」，目前值為：{member_type}')

                # 驗證管理員欄位
                is_admin = str(row['是否為管理員']).strip()
                if is_admin and is_admin not in ['是', '否']:
                    row_errors.append(f'第 {idx + 2} 行：是否為管理員必須是「是」或「否」，目前值為：{is_admin}')

                # 驗證性別
                gender = str(row['性別']).strip()
                if gender and gender not in ['M', 'F']:
                    row_errors.append(f'第 {idx + 2} 行：性別必須是「M」或「F」，目前值為：{gender}')

                # 驗證差點格式（如果存在）
                if '差點' in row and str(row['差點']).strip():
                    try:
                        handicap = float(str(row['差點']).strip())
                    except ValueError:
                        row_errors.append(f'第 {idx + 2} 行：差點必須是數字，目前值為：{row["差點"]}')

                # 如果有錯誤，加入到錯誤列表
                if row_errors:
                    errors.extend(row_errors)
                else:
                    valid_rows.append(row)
                    
            except Exception as e:
                logger.error(f'處理第 {idx + 2} 行時發生異常：{str(e)}')
                logger.error(f'該行資料內容：{row.to_dict()}')
                errors.append(f'第 {idx + 2} 行處理失敗：{str(e)}')

        if errors:
            error_summary = '\n'.join(errors)
            logger.error(f'資料驗證發現錯誤：\n{error_summary}')
            raise ValueError(error_summary)

        # 創建新的 DataFrame，只包含有效的資料行
        valid_df = pd.DataFrame(valid_rows)
        logger.info(f'成功處理 {len(valid_rows)} 行資料')
        return valid_df

    except Exception as e:
        logger.error(f'處理 Excel 數據時發生錯誤：{str(e)}')
        raise ValueError(f'處理 Excel 數據時發生錯誤：{str(e)}')

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
                    'gender': member.gender,
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

        # 確保上傳目錄存在
        upload_dir = ensure_upload_dir()
        logger.info(f'Upload directory: {upload_dir}')
        
        # 使用安全的檔案名稱儲存檔案
        filename = secure_filename(file.filename)
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        logger.info(f'File saved to: {filepath}')
        
        try:
            logger.info('Reading Excel file...')
            # 讀取 Excel 檔案時不過濾空值
            df = pd.read_excel(filepath, dtype=str, na_filter=False)
            logger.info(f'Excel file read successfully: {len(df)} rows')
            logger.info(f'Columns found in file: {df.columns.tolist()}')
            
            if len(df) == 0:
                logger.error('Empty Excel file')
                return jsonify({
                    'error': 'Excel 檔案為空',
                    'error_messages': ['上傳的 Excel 檔案沒有任何資料'],
                    'success_count': 0
                }), 400

            # 檢查必要欄位
            required_columns = ['會員編號', '會員類型', '帳號', '是否為管理員', '性別']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                error_msg = f'缺少以下必要欄位：{", ".join(missing_columns)}'
                logger.error(error_msg)
                return jsonify({
                    'error': '缺少必要欄位',
                    'error_messages': [error_msg],
                    'success_count': 0
                }), 400

            # 清理和驗證數據
            error_messages = []
            valid_rows = []
            
            for idx, row in df.iterrows():
                row_errors = []
                
                # 檢查必填欄位
                for col in required_columns:
                    if pd.isna(row[col]) or str(row[col]).strip() == '':
                        row_errors.append(f'第 {idx + 2} 行：{col} 不能為空')

                # 驗證會員類型
                member_type = str(row['會員類型']).strip()
                if member_type not in ['會員', '來賓']:
                    row_errors.append(f'第 {idx + 2} 行：會員類型必須是「會員」或「來賓」，目前值為：{member_type}')

                # 驗證管理員欄位
                is_admin = str(row['是否為管理員']).strip()
                if is_admin not in ['是', '否']:
                    row_errors.append(f'第 {idx + 2} 行：是否為管理員必須是「是」或「否」，目前值為：{is_admin}')

                # 驗證性別
                gender = str(row['性別']).strip()
                if gender not in ['M', 'F']:
                    row_errors.append(f'第 {idx + 2} 行：性別必須是「M」或「F」，目前值為：{gender}')

                if row_errors:
                    error_messages.extend(row_errors)
                else:
                    # 清理數據
                    row_data = row.copy()
                    for col in df.columns:
                        if pd.isna(row_data[col]) or str(row_data[col]).strip() in ['(null)', 'null', 'nan', '']:
                            row_data[col] = ''
                    valid_rows.append(row_data)

            if error_messages:
                logger.error('Validation errors found')
                logger.error('\n'.join(error_messages))
                return jsonify({
                    'error': '資料驗證失敗',
                    'error_messages': error_messages,
                    'success_count': 0
                }), 400

            # 處理有效的資料
            version_number = generate_version_number()
            for row in valid_rows:
                member_data = {
                    'member_number': row['會員編號'],
                    'account': row['帳號'],
                    'chinese_name': row.get('中文姓名', ''),
                    'english_name': row.get('英文姓名', ''),
                    'department_class': row.get('系級', ''),
                    'is_guest': row['會員類型'] == '來賓',
                    'is_admin': row['是否為管理員'] == '是',
                    'gender': row['性別'],
                    'handicap': float(row['差點']) if pd.notna(row.get('差點')) and str(row['差點']).strip() != '' else None
                }

                # 檢查是否已存在相同帳號的會員
                existing_member = Member.query.filter_by(account=member_data['account']).first()
                if existing_member:
                    # 更新現有會員資料
                    for key, value in member_data.items():
                        setattr(existing_member, key, value)
                    member = existing_member
                else:
                    # 創建新會員
                    member = Member(**member_data)
                    db.session.add(member)
                
                db.session.flush()

                version = MemberVersion(
                    member_id=member.id,
                    version=version_number,
                    data=member_data,
                    created_at=datetime.now()
                )
                db.session.add(version)

            db.session.commit()
            logger.info(f'Successfully processed {len(valid_rows)} rows')
            return jsonify({
                'success': True,
                'message': f'成功處理 {len(valid_rows)} 筆資料',
                'success_count': len(valid_rows)
            })

        except pd.errors.EmptyDataError:
            logger.error('Empty Excel file')
            return jsonify({
                'error': 'Excel 檔案為空',
                'error_messages': ['上傳的 Excel 檔案沒有任何資料'],
                'success_count': 0
            }), 400
        except Exception as e:
            logger.error(f'Error processing data: {str(e)}')
            logger.error(traceback.format_exc())
            return jsonify({
                'error': '資料處理過程中發生錯誤',
                'error_messages': [str(e)],
                'success_count': 0
            }), 400

    except Exception as e:
        logger.error(f'Unexpected error: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({
            'error': '系統錯誤',
            'error_messages': [str(e)],
            'success_count': 0
        }), 500

    finally:
        # 清理臨時檔案
        try:
            if 'filepath' in locals() and os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f'Temporary file removed: {filepath}')
        except Exception as e:
            logger.error(f'Error removing temporary file: {str(e)}')

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
            gender=data.get('gender'),
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
                
            if 'gender' in data:
                member.gender = str(data['gender'])
                
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
            for field in ['handicap', 'is_guest', 'is_admin', 'chinese_name', 'english_name', 'department_class', 'gender']:
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
                  'member_number', 'is_guest', 'is_admin', 'gender', 'handicap']
                  
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

@bp.route('/export', methods=['GET'])
def export_members():
    """匯出會員資料為 Excel 檔案"""
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
            return jsonify({'error': '沒有會員資料可供匯出'}), 400
            
        logger.info(f'Exporting members for version: {version}')
        
        # 使用指定版本號獲取會員資料
        members = db.session.query(Member).join(MemberVersion)\
            .filter(MemberVersion.version == version)\
            .order_by(Member.member_number)\
            .all()
            
        if not members:
            return jsonify({'error': f'版本 {version} 沒有會員資料'}), 404
            
        # 準備 Excel 數據
        data = []
        for member in members:
            data.append({
                '會員編號': member.member_number,
                '帳號': member.account,
                '中文姓名': member.chinese_name,
                '英文姓名': member.english_name,
                '系級': member.department_class,
                '會員類型': '來賓' if member.is_guest else '會員',
                '管理權限': '是' if member.is_admin else '否',
                '差點': member.handicap
            })
            
        # 創建 DataFrame
        df = pd.DataFrame(data)
        
        # 創建一個 BytesIO 對象來保存 Excel 文件
        excel_file = io.BytesIO()
        
        # 將 DataFrame 寫入 Excel
        with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='會員資料')
            
        # 將指針移到文件開頭
        excel_file.seek(0)
        
        # 生成下載文件名
        current_time = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'members_v{version}_{current_time}.xlsx'
        
        # 返回 Excel 文件
        return send_file(
            excel_file,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
            
    except Exception as e:
        logger.error(f'Error exporting members: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'error': '匯出會員資料失敗'}), 500

@bp.route('/template', methods=['GET'])
def download_template():
    """下載會員資料上傳用的 Excel 範本"""
    try:
        # 創建範本數據
        template_data = {
            '會員編號': ['M001', 'F001'],  # 範例：M開頭為男性會員，F開頭為女性會員
            '帳號': ['user1', 'user2'],
            '中文姓名': ['王小明', '李小華'],
            '英文姓名': ['Wang, Xiao-Ming', 'Lee, Xiao-Hua'],
            '系級': ['資工系', '企管系'],
            '會員類型': ['會員', '來賓'],
            '是否為管理員': ['是', '否'],
            '性別': ['M', 'F'],  # 修改為使用 M/F
            '差點': [0, 0],
        }
        
        df = pd.DataFrame(template_data)
        
        # 創建 Excel 檔案
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='會員資料範本')
            worksheet = writer.sheets['會員資料範本']
            
            # 調整欄寬
            for idx, col in enumerate(df.columns):
                max_length = max(
                    df[col].astype(str).apply(len).max(),
                    len(col)
                )
                worksheet.column_dimensions[chr(65 + idx)].width = max_length + 4
        
        output.seek(0)
        return output.getvalue()
        
    except Exception as e:
        current_app.logger.error(f'生成範本時發生錯誤：{str(e)}')
        raise
