from flask import Blueprint, jsonify, request, current_app, send_file
from app.models import YearlyChampion, db
from datetime import datetime
from sqlalchemy import func
import traceback
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter
from io import BytesIO
from app.api import bp

@bp.route('/awards', methods=['GET'])
def get_awards():
    """根據賽事名稱獲取獎項列表"""
    try:
        tournament_name = request.args.get('tournament_name', '')
        
        if tournament_name:
            # 根據賽事名稱篩選
            champions = YearlyChampion.query.filter(
                YearlyChampion.tournament_name == tournament_name
            ).order_by(YearlyChampion.date.desc()).all()
        else:
            # 如果沒有指定賽事名稱，返回所有獎項
            champions = YearlyChampion.query.order_by(YearlyChampion.date.desc()).all()
        
        return jsonify([c.to_dict() for c in champions])
    except Exception as e:
        current_app.logger.error(f"獲取獎項列表失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '獲取獎項列表失敗',
            'details': str(e)
        }), 500

@bp.route('/awards/export', methods=['GET'])
def export_awards():
    """匯出獎項資料為 Excel 檔案"""
    try:
        tournament_name = request.args.get('tournament_name', '')
        
        if not tournament_name:
            return jsonify({'error': '請指定賽事名稱'}), 400
        
        # 獲取獎項資料
        champions = YearlyChampion.query.filter(
            YearlyChampion.tournament_name == tournament_name
        ).order_by(YearlyChampion.date.desc()).all()
        
        if not champions:
            return jsonify({'error': '沒有可匯出的資料'}), 404
        
        # 建立 Excel 工作簿
        wb = Workbook()
        ws = wb.active
        ws.title = "獎項管理"
        
        # 設定標題行樣式
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF", size=12)
        header_alignment = Alignment(horizontal="center", vertical="center")
        
        # 設定標題
        headers = ['年度', '賽事名稱', '會員姓名', '總桿數', '日期']
        ws.append(headers)
        
        # 設定標題行樣式
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_alignment
        
        # 填入資料
        data_font = Font(size=11)
        data_alignment = Alignment(horizontal="left", vertical="center")
        
        for champion in champions:
            row = [
                champion.year,
                champion.tournament_name,
                champion.member_name,
                champion.total_strokes,
                champion.date.strftime('%Y-%m-%d') if champion.date else ''
            ]
            ws.append(row)
            
            # 設定資料行樣式
            for col_num in range(1, len(headers) + 1):
                cell = ws.cell(row=ws.max_row, column=col_num)
                cell.font = data_font
                cell.alignment = data_alignment
        
        # 自動調整欄寬
        for col_num, header in enumerate(headers, 1):
            max_length = len(header)
            for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=col_num, max_col=col_num):
                for cell in row:
                    if cell.value:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[get_column_letter(col_num)].width = adjusted_width
        
        # 設定行高
        ws.row_dimensions[1].height = 25
        for row_num in range(2, ws.max_row + 1):
            ws.row_dimensions[row_num].height = 20
        
        # 建立檔案緩衝區
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        # 產生檔案名稱
        filename = f'獎項管理_{tournament_name}_{datetime.now().strftime("%Y%m%d")}.xlsx'
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        current_app.logger.error(f"匯出獎項資料失敗: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': '匯出獎項資料失敗',
            'details': str(e)
        }), 500

