import pandas as pd
from datetime import datetime

# 創建測試數據
test_data = [
    {
        '帳號': 'test1@example.com',
        '中文姓名': '測試會員1',
        '英文姓名': 'Test Member 1',
        '系級': '資工系',
        '會員編號': 'A001',
        '會員類型': '會員',
        '是否為管理員': '否',
        '性別': 'M',
        '差點': 10.5
    },
    {
        '帳號': 'test2@example.com',
        '中文姓名': '測試會員2',
        '英文姓名': 'Test Member 2',
        '系級': '電機系',
        '會員編號': 'A002',
        '會員類型': '會員',
        '是否為管理員': '是',
        '性別': 'F',
        '差點': 15.2
    },
    {
        '帳號': 'guest@example.com',
        '中文姓名': '來賓測試',
        '英文姓名': 'Guest Test',
        '系級': '',
        '會員編號': 'G001',
        '會員類型': '來賓',
        '是否為管理員': '否',
        '性別': 'M',
        '差點': None
    }
]

# 創建 DataFrame
df = pd.DataFrame(test_data)

# 保存為 Excel 檔案
output_file = 'test_members.xlsx'
df.to_excel(output_file, index=False)
print(f'測試檔案已創建: {output_file}')
