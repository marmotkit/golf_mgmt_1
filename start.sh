#!/bin/bash

echo "設置環境變數..."
export FLASK_APP=run.py
export PYTHONPATH=$PWD

echo "開始執行資料庫遷移..."
flask db upgrade
echo "資料庫遷移完成"

echo "開始初始化資料庫..."
python init_db.py
echo "資料庫初始化完成"

echo "啟動應用程式..."
exec gunicorn run:app 