import pandas as pd

# 創建測試成績數據
data = {
    '姓名': ['張三', '李四', '王五'],
    '總桿數': [82, 88, 79],
    '差點': [10.5, 15.2, 8.7],
    '淨桿': [71.5, 72.8, 70.3],
    '新差點': [10.2, 15.0, 8.5],
    '積分': [10, 8, 12]
}

# 創建 DataFrame
df = pd.DataFrame(data)

# 保存為 Excel 檔案
df.to_excel('test_scores.xlsx', index=False)
print('測試成績 Excel 檔案已創建')
