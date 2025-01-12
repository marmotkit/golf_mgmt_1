import os
import subprocess
import sys

def main():
    try:
        print("當前目錄:", os.getcwd())
        print("列出目錄內容:")
        subprocess.run(["ls", "-la"], check=True)
        
        print("\n設置環境變數...")
        os.environ["FLASK_APP"] = "run.py"
        os.environ["PYTHONPATH"] = os.getcwd()
        
        print("\n開始執行資料庫遷移...")
        from flask_migrate import upgrade
        upgrade()
        print("資料庫遷移完成")
        
        print("\n開始初始化資料庫...")
        print("檢查資料庫連接...")
        from app import db
        db.engine.connect()
        print("資料庫連接成功")
        
        print("\n執行初始化腳本...")
        subprocess.run([sys.executable, "init_db.py"], check=True)
        print("資料庫初始化完成")
        
        print("\n啟動 Gunicorn...")
        os.execvp("gunicorn", ["gunicorn", "run:app"])
    except Exception as e:
        print(f"錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 