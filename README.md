# 清華大學校友高爾夫球隊賽事管理系統

## 系統概述
這是一個專為清華大學校友高爾夫球隊開發的賽事管理系統。系統採用現代化的網頁應用架構，提供直觀的使用者介面，協助管理球隊賽事、會員資料、成績記錄等各項功能。

## 系統版本
當前版本：V4.5
更新日期：2024-02-14

## 技術架構
### 前端技術
- React.js 18.2.0
- Material-UI (MUI) 5.16.13
- Axios HTTP 客戶端 1.7.9
- React Router DOM 6.28.1
- 響應式設計，支援多種設備

### 後端技術
- Python Flask 3.0.0
- PostgreSQL 資料庫
- SQLAlchemy ORM 2.0.23
- Flask-Migrate 4.0.5
- Flask-JWT-Extended 4.5.3
- RESTful API 設計

### 部署環境
- 前端：Render.com 靜態網站託管
  - 網址：https://golf-mgmt-1-frontend.onrender.com
- 後端：Render.com Web Service
  - 網址：https://golf-mgmt-1.onrender.com
- 資料庫：Render.com PostgreSQL

## 系統功能

### A. 會員管理
1. 會員資料管理
   - 支援 Excel 批量上傳會員資料
   - 會員資料版本控制與差異比對
   - 單筆會員新增/編輯/刪除
   - 批量刪除功能
   - 會員資料匯出 Excel

2. 會員資料欄位
   - 會員編號（唯一識別碼）
   - 中文姓名
   - 英文姓名（用於登入）
   - 系級
   - 會員類型（會員/來賓）
   - 性別
   - 差點
   - 管理員權限

### B. 賽事管理
1. 賽事基本資料
   - 賽事名稱
   - 日期
   - 場地
   - 備註說明

2. 賽事獎項管理
   - 技術獎（一般組/長青組）
     * 一般組第一近洞
     * 一般組第二近洞
     * 一般組第三近洞
     * 長青組第一近洞
   - 跳跳獎
   - 總桿冠軍
   - 淨桿獎（1-10名）
   - 會長獎
   - BB獎
   - Eagle獎
   - HIO（一桿進洞）
   - 其他客製化獎項

### C. 成績管理
1. 成績記錄功能
   - Excel 成績單批量上傳
   - 自動計算差點
   - 自動計算積分
   - 成績資料匯出 Excel

2. 成績查詢功能
   - 依賽事查詢
   - 依會員查詢
   - 年度統計
   - 積分排名

### D. 報表分析
1. 統計報表
   - 各組平均差點統計
   - 各組平均桿數統計
   - 積分排名前 10 名
   - 總桿數前 10 名
   - 進步最多前 5 名
   - 全勤獎統計

2. 資料匯出
   - Excel 格式匯出
   - 自訂報表範圍

### E. 系統管理
1. 儀表板
   - 系統概況
   - 最新公告
   - 近期賽事
   - 年度冠軍榜

2. 版本管理
   - 版本更新記錄
   - 系統說明文件

### F. 遊戲功能
1. 轉盤抽獎
   - 可自訂獎項內容
   - 動態轉盤效果
   - 獎項管理功能

## 安裝說明

### 後端設置
1. 安裝 Python 依賴套件：
```bash
pip install -r requirements.txt
```

2. 設置環境變數：
```bash
cp .env.example .env
# 編輯 .env 文件，設置必要的環境變數：
# FLASK_APP=run.py
# FLASK_ENV=development
# DATABASE_URL=postgresql://username:password@localhost:5432/dbname
# SECRET_KEY=your-secret-key
# JWT_SECRET_KEY=your-jwt-secret-key
```

3. 初始化資料庫：
```bash
python init_db_with_migrate.py
```

4. 初始化獎項類型：
```bash
python init_award_types.py
```

5. 運行開發伺服器：
```bash
flask run
```

### 前端設置
1. 安裝 Node.js 依賴：
```bash
cd frontend
npm install
```

2. 設置環境變數：
```bash
cp .env.example .env
# 編輯 .env 文件，設置 API 位址：
# REACT_APP_API_URL=http://localhost:5000
```

3. 運行開發伺服器：
```bash
npm start
```

## 部署說明
1. 後端部署（Render.com Web Service）
   - 連接 GitHub 倉庫
   - 設置環境變數
   - 設置啟動命令：`sh start.sh`
   - 設置健康檢查路徑：`/health`

2. 前端部署（Render.com Static Site）
   - 連接 GitHub 倉庫
   - 設置建構命令：`cd frontend && npm install && npm run build`
   - 設置發布目錄：`frontend/build`
   - 設置路由規則（`_redirects` 文件）

## 版本歷史
- V4.5 (2024-02-14)
  - 修正 API 路由配置
  - 解決登入問題
  - 優化錯誤處理
- V4.0 (2024-02-14)
  - 新增跳跳獎獎項類型
  - 調整獎項順序
  - 優化獎項管理介面
- V3.0 (2024-02-12)
  - 新增獎項管理功能
  - 新增轉盤遊戲功能
- V2.0 (2024-02-10)
  - 新增報表分析功能
  - 優化成績管理介面
- V1.0 (2024-02-08)
  - 系統初始版本
  - 基本會員管理功能
  - 基本賽事管理功能

## 注意事項
1. 資料備份
   - 定期備份資料庫（建議每週一次）
   - 保存重要 Excel 檔案
   - 使用版本控制追蹤重要更改

2. 系統維護
   - 定期更新系統版本
   - 監控系統效能
   - 檢查錯誤日誌
   - 清理暫存檔案

3. 安全性
   - 定期更改管理員密碼
   - 控制管理員權限
   - 保護敏感資料
   - 使用 HTTPS 加密傳輸

## 常見問題
1. 登入問題
   - 確認使用英文姓名作為帳號
   - 確認會員編號正確
   - 檢查是否有管理員權限

2. 上傳問題
   - 確認 Excel 檔案格式正確
   - 檢查必要欄位是否完整
   - 檢查檔案大小是否超過限制

3. 系統錯誤
   - 檢查網路連接
   - 清除瀏覽器快取
   - 重新整理頁面
   - 聯繫系統管理員

## 技術支援
如有任何問題或建議，請聯繫系統管理員：
- Email：admin@example.com
- 電話：(02) 1234-5678
- 服務時間：週一至週五 9:00-18:00
