import multiprocessing

wsgi_app = "otb_server.wsgi:application"
workers = multiprocessing.cpu_count() * 2 + 1
bind = "0.0.0.0:8000"
