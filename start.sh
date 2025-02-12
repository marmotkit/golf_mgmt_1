#!/bin/bash

# 執行數據庫遷移
python init_db_with_migrate.py

# 啟動應用，添加 timeout 參數
gunicorn "app:create_app()" --timeout 120 