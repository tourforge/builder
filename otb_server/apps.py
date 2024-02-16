from django.apps import AppConfig

class YourAppNameConfig(AppConfig):
    name = 'otb_server'

    def ready(self):
        from . import signals