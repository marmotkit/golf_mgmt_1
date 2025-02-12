#!/bin/bash

# 執行數據庫遷移
python init_db_with_migrate.py

# 啟動應用
gunicorn run:app 