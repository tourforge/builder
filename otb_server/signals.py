import os
from django.db import models
from django.dispatch import receiver
from .models import Project, Asset

def _delete_file(path):
   if os.path.isfile(path):
       os.remove(path)

@receiver(models.signals.post_delete, sender=Project)
def delete_file(sender, instance, *args, **kwargs):
    if instance.published_bundle:
        _delete_file(instance.published_bundle.path)

@receiver(models.signals.post_delete, sender=Asset)
def delete_file(sender, instance, *args, **kwargs):
    if instance.file:
        _delete_file(instance.file.path)