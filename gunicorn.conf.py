import multiprocessing

# 工作進程數
workers = multiprocessing.cpu_count() * 2 + 1

# 每個工作進程的線程數
threads = 2

# 監聽地址和端口
bind = "0.0.0.0:10000"

# 超時設置
timeout = 120

# 訪問日誌格式
accesslog = "-"
errorlog = "-"

# 工作模式
worker_class = "sync"

# 最大請求數
max_requests = 1000
max_requests_jitter = 50

# 重啟工作進程
graceful_timeout = 120 