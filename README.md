# 高爾夫球賽管理系統

這是一個專門為高爾夫球賽事管理設計的網頁應用系統。系統提供完整的會員管理、賽事管理、成績記錄和統計分析功能。

## 主要功能

### 1. 會員管理
- 會員資料管理（新增、編輯、刪除）
- 批量導入會員資料（支援 Excel 檔案上傳）
- 會員資料欄位包含：
  - 會員編號
  - 姓名（中文、英文）
  - 性別
  - 等級
  - 差點
  - 聯絡資訊

### 2. 賽事管理
- 賽事資訊管理（新增、編輯、刪除）
- 賽事資料欄位包含：
  - 賽事名稱
  - 日期
  - 地點
  - 賽事說明
  - 參賽名單

### 3. 成績管理
- 成績記錄上傳（支援 Excel 檔案上傳）
- 成績查詢和編輯
- 自動計算差點變化
- 成績統計分析
- 年度總成績統計
  - 可選擇多場賽事進行統計
  - 自動計算平均桿數
  - 計算參賽次數
  - 計算平均差點
  - 統計年度積分
  - 支援依各項數據排序

### 4. 系統公告
- 公告管理（新增、編輯、刪除）
- 首頁公告展示

## 本地部署步驟

### 系統需求
- Python 3.8 或以上版本
- Node.js 14 或以上版本
- MySQL 8.0 或以上版本

### 後端設置
1. 克隆專案
```bash
git clone https://github.com/marmotkit/golf_mgmt_1.git
cd golf_mgmt_1
```

2. 建立 Python 虛擬環境
```bash
python -m venv venv
source venv/bin/activate  # Windows 使用: venv\Scripts\activate
```

3. 安裝後端依賴
```bash
pip install -r requirements.txt
```

4. 設定資料庫
- 在 MySQL 中創建新的資料庫
- 複製 `.env.example` 為 `.env`
- 修改 `.env` 中的資料庫連線設定

5. 執行資料庫遷移
```bash
flask db upgrade
```

6. 啟動後端服務
```bash
flask run
```

### 前端設置
1. 進入前端目錄
```bash
cd frontend
```

2. 安裝前端依賴
```bash
npm install
```

3. 啟動前端開發服務器
```bash
npm start
```

### 訪問系統
- 前端介面：http://localhost:3000
- 後端 API：http://localhost:5000

## 環境部署說明

### 本地環境部署

### 外網環境部署

#### 方案一：使用 Vercel + Render 部署（推薦）

##### 前端部署 (Vercel)

1. 準備工作
- 註冊 Vercel 帳號並連接 GitHub
- 確保前端代碼在獨立的 `frontend` 目錄中

2. 部署步驟
- 在 Vercel 控制台中導入專案
- 設定環境變數：
  ```
  REACT_APP_API_URL=https://your-backend.onrender.com/api
  ```
- 選擇 `frontend` 作為根目錄
- 部署指令設定：
  ```
  Build Command: npm run build
  Output Directory: build
  ```

##### 後端部署 (Render)

1. 準備工作
- 註冊 Render 帳號
- 在 Render 上建立 Web Service
- 在 Render 上建立 MySQL 資料庫（或使用其他資料庫服務）

2. 部署步驟
- 連接 GitHub 倉庫
- 設定環境變數：
  ```
  FLASK_ENV=production
  DATABASE_URL=mysql://user:pass@your-db-host/db_name
  CORS_ORIGINS=https://your-frontend.vercel.app
  ```
- 設定啟動指令：
  ```
  Build Command: pip install -r requirements.txt
  Start Command: gunicorn wsgi:app
  ```

3. 資料庫遷移
```bash
# 在 Render 的 Shell 中執行
flask db upgrade
```

#### 方案二：使用雲端服務器

1. 準備工作
- 購買雲端服務器（建議：2核心 CPU，4GB 記憶體以上）
- 註冊域名（可選）
- 申請 SSL 證書（可選，用於 HTTPS）

2. 服務器環境設置
```bash
# 安裝必要套件
sudo apt update
sudo apt install python3-pip python3-venv nodejs npm mysql-server nginx

# 設置 MySQL
sudo mysql_secure_installation
```

3. 專案部署
```bash
# 克隆專案
git clone https://github.com/marmotkit/golf_mgmt_1.git
cd golf_mgmt_1

# 後端設置
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn  # 生產環境 WSGI 服務器

# 前端建置
cd frontend
npm install
npm run build
```

4. 設置 Nginx
```nginx
server {
    listen 80;
    server_name your_domain.com;  # 替換為您的域名

    # 前端靜態文件
    location / {
        root /path/to/golf_mgmt_1/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # 後端 API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

5. 啟動服務
```bash
# 啟動後端（使用 gunicorn）
gunicorn -w 4 -b 127.0.0.1:8000 wsgi:app

# 啟動 Nginx
sudo service nginx restart
```

### 多環境管理建議

1. 環境配置文件
- 本地開發：使用 `.env.development`
- Vercel 部署：使用 Vercel 環境變數
- Render 部署：使用 Render 環境變數
```bash
# .env.development 示例
FLASK_ENV=development
DATABASE_URL=mysql://user:pass@localhost/golf_db
API_URL=http://localhost:5000

# Vercel 環境變數
REACT_APP_API_URL=https://your-backend.onrender.com/api

# Render 環境變數
FLASK_ENV=production
DATABASE_URL=mysql://user:pass@your-db-host/db_name
CORS_ORIGINS=https://your-frontend.vercel.app
```

2. 資料庫同步
- 使用資料庫備份和還原功能
- 本地到 Render：
```bash
# 備份本地資料庫
mysqldump -u user -p golf_db > local_backup.sql

# 在 Render 的 Shell 中還原
mysql -u user -p golf_db < local_backup.sql
```

3. 自動部署流程
- 前端（Vercel）：
  - 推送到 GitHub 自動觸發部署
  - 可在 Vercel 控制台查看部署狀態

- 後端（Render）：
  - 推送到 GitHub 自動觸發部署
  - 可在 Render 控制台查看部署狀態和日誌

4. 開發工作流程
- 本地開發和測試
- 提交到 GitHub
- 自動部署到 Vercel 和 Render
- 檢查部署狀態
- 必要時同步資料庫

## 注意事項
1. 確保 MySQL 服務已啟動
2. 確保後端和前端服務都正常運行
3. 首次使用需要在系統中創建管理員帳號
4. 建議定期備份資料庫
5. 外網部署時注意資料安全性
   - 使用強密碼
   - 定期更新系統和套件
   - 在 Vercel 和 Render 中妥善保管環境變數
   - 設定適當的 CORS 策略
   - 定期備份 Render 資料庫
   - 監控 Vercel 和 Render 的使用量和性能

## 技術支援
如有任何問題，請聯繫系統管理員或參考技術文檔。
也可以查看：
- Vercel 文檔：https://vercel.com/docs
- Render 文檔：https://render.com/docs
