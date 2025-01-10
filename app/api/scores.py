from flask import Blueprint, jsonify, request
from app.models import Score, db

bp = Blueprint('scores', __name__)
# ... 其他路由代碼 ...
from flask import jsonify, request, current_app
from app.api import bp
from app.models import Score, db, Tournament, Member
import pandas as pd
import os
from werkzeug.utils import secure_filename
import traceback
from openpyxl import load_workbook
import uuid
import csv

@bp.route('/scores', methods=['GET'])
def get_scores():
    try:
        tournament_id = request.args.get('tournament_id', type=int)
        query = Score.query
        
        if tournament_id:
            query = query.filter_by(tournament_id=tournament_id)
        
        scores = query.order_by(Score.net_rank).all()
        return jsonify([s.to_dict() for s in scores])
    except Exception as e:
        current_app.logger.error(f'獲取成績列表時發生錯誤：{str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/scores/<int:id>', methods=['GET'])
def get_score(id):
    score = Score.query.get_or_404(id)
    return jsonify(score.to_dict())

@bp.route('/scores/import/<int:tournament_id>', methods=['POST'])
def import_scores(tournament_id):
    temp_path = None
    try:
        if 'file' not in request.files:
            return jsonify({'error': '未找到上傳的檔案'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '未選擇檔案'}), 400
        
        # 檢查檔案類型
        if not file.filename.endswith(('.xlsx', '.xls')):
            return jsonify({'error': '不支援的檔案格式，請使用 Excel 檔案 (.xlsx 或 .xls)'}), 400
        
        # 保存原始檔案名
        original_filename = file.filename
        
        # 創建臨時目錄（如果不存在）
        upload_dir = os.path.join(current_app.instance_path, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # 使用原始檔案名保存檔案
        temp_path = os.path.join(upload_dir, original_filename)
        
        # 保存檔案
        file.save(temp_path)
        
        try:
            # 使用 pandas 讀取 Excel 檔案
            df = pd.read_excel(temp_path)
            
            # 清理列名（移除空白和特殊字符）
            df.columns = df.columns.str.strip().str.replace('\ufeff', '').str.replace('\u3000', ' ')
            
            # 檢查必要的欄位是否存在
            required_columns = ['會員編號', 'HOLE', '姓名', '淨桿名次', '總桿數', 
                              '前次差點', '淨桿桿數', '差點增減', '新差點', '積分']
            
            # 檢查每個必要欄位
            missing_columns = []
            column_mapping = {}
            for col in required_columns:
                found = False
                for existing_col in df.columns:
                    if col in existing_col:  # 使用部分匹配
                        column_mapping[col] = existing_col
                        found = True
                        break
                if not found:
                    missing_columns.append(col)
            
            if missing_columns:
                raise Exception(f'Excel 檔案缺少以下欄位：{", ".join(missing_columns)}')
            
            # 重命名列以匹配所需的名稱
            df = df.rename(columns=column_mapping)
            
            # 清理數據
            for col in df.columns:
                if df[col].dtype == object:  # 如果是字符串類型
                    df[col] = df[col].astype(str).str.strip()
            
            # 刪除該賽事的所有現有成績
            Score.query.filter_by(tournament_id=tournament_id).delete()
            
            # 處理每一行數據
            for _, row in df.iterrows():
                try:
                    score = Score(tournament_id=tournament_id)
                    
                    # 設置各個欄位，處理可能的空值和特殊字符
                    score.member_number = str(row['會員編號']).strip() if pd.notna(row['會員編號']) else None
                    score.full_name = str(row['HOLE']).strip() if pd.notna(row['HOLE']) else None
                    score.chinese_name = str(row['姓名']).strip() if pd.notna(row['姓名']) else None
                    
                    # 處理數值欄位
                    try:
                        score.net_rank = int(row['淨桿名次']) if pd.notna(row['淨桿名次']) else None
                    except (ValueError, TypeError):
                        score.net_rank = None
                        
                    try:
                        score.gross_score = int(row['總桿數']) if pd.notna(row['總桿數']) else None
                    except (ValueError, TypeError):
                        score.gross_score = None
                        
                    try:
                        score.previous_handicap = float(row['前次差點']) if pd.notna(row['前次差點']) else None
                    except (ValueError, TypeError):
                        score.previous_handicap = None
                        
                    try:
                        score.net_score = float(row['淨桿桿數']) if pd.notna(row['淨桿桿數']) else None
                    except (ValueError, TypeError):
                        score.net_score = None
                        
                    try:
                        score.handicap_change = float(row['差點增減']) if pd.notna(row['差點增減']) else None
                    except (ValueError, TypeError):
                        score.handicap_change = None
                        
                    try:
                        score.new_handicap = float(row['新差點']) if pd.notna(row['新差點']) else None
                    except (ValueError, TypeError):
                        score.new_handicap = None
                        
                    try:
                        score.points = int(row['積分']) if pd.notna(row['積分']) else None
                    except (ValueError, TypeError):
                        score.points = None
                    
                    # 根據會員編號查找會員 ID
                    if score.member_number:
                        member = Member.query.filter_by(member_number=score.member_number).first()
                        if member:
                            score.member_id = member.id
                        else:
                            # 如果找不到會員，創建一個新的會員
                            member = Member(
                                member_number=score.member_number,
                                name=score.chinese_name,
                                handicap=score.new_handicap
                            )
                            db.session.add(member)
                            db.session.flush()  # 獲取新創建的會員 ID
                            score.member_id = member.id
                    
                    db.session.add(score)
                
                except Exception as row_error:
                    current_app.logger.error(f'處理行數據時發生錯誤：{str(row_error)}')
                    current_app.logger.error(f'行數據：{row.to_dict()}')
                    raise Exception(f'處理行數據時發生錯誤：{str(row_error)}')
            
            db.session.commit()
            return jsonify({'message': '成績匯入成功'})
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'讀取檔案失敗：{str(e)}')
    
    except Exception as e:
        current_app.logger.error(f'匯入成績時發生錯誤：{str(e)}')
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    
    finally:
        # 清理臨時檔案
        try:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            current_app.logger.error(f'清理臨時檔案時發生錯誤：{str(e)}')

@bp.route('/scores', methods=['POST'])
def create_score():
    data = request.get_json()
    score = Score()
    score.from_dict(data)
    db.session.add(score)
    db.session.commit()
    return jsonify(score.to_dict()), 201

@bp.route('/scores/<int:id>', methods=['PUT'])
def update_score(id):
    score = Score.query.get_or_404(id)
    data = request.get_json()
    score.from_dict(data)
    db.session.commit()
    return jsonify(score.to_dict())

@bp.route('/scores/<int:id>', methods=['DELETE'])
def delete_score(id):
    score = Score.query.get_or_404(id)
    db.session.delete(score)
    db.session.commit()
    return '', 204
