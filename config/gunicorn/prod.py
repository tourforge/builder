import multiprocessing

wsgi_app = "tf_server.wsgi:application"
workers = multiprocessing.cpu_count() * 2 + 1
bind = "unix:/code/gunicorn.sock"
