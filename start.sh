#!/bin/bash

# 執行數據庫遷移
python init_db_with_migrate.py

# 重置獎項類型
python reset_awards.py

# 啟動應用，添加 timeout 參數
gunicorn "app:create_app()" --timeout 120 