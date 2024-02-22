from django.apps import AppConfig

class YourAppNameConfig(AppConfig):
    name = 'tf_server'

    def ready(self):
        from . import signals