import re
import os

from django.db import models
from django.contrib.auth.models import AbstractUser

import uuid

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

def _published_bundle_path(instance, filename: str):
    return f"published-bundles/{instance.id}.zip"

def _delete_file(path):
   if os.path.isfile(path):
       os.remove(path)

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    published_bundle = models.FileField(upload_to=_published_bundle_path, default=None, null=True)

    def save(self, *args, **kwargs):
        # Check if the file is being updated
        if self.id:
            try:
                old_file = Project.objects.get(id=self.id).published_bundle
                if old_file != self.published_bundle:
                    _delete_file(published_bundle.path)
            except Project.DoesNotExist:
                pass

        super(Project, self).save(*args, **kwargs)

class Tour(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.JSONField()

class ProjectMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    admin = models.BooleanField(default=False)

    class Meta:
        unique_together = [('user', 'project')]

_EXTENSION_REGEX = re.compile(r'^.*(\.[a-zA-Z0-9-]+)$')
def _asset_path(instance, filename: str):
    result = _EXTENSION_REGEX.search(filename)
    ext = result.group(1) if result is not None else ''

    return f"{instance.project.id}/{instance.id}{ext}"

class Asset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    hash = models.CharField(max_length=64)
    file = models.FileField(upload_to=_asset_path)

    def save(self, *args, **kwargs):
        # Check if the file is being updated
        if self.id:
            try:
                old_file = Asset.objects.get(id=self.id).file
                if old_file != self.file:
                    _delete_file(old_file.path)
            except Asset.DoesNotExist:
                pass

        super(Asset, self).save(*args, **kwargs)

    class Meta:
        unique_together = [('project', 'name')]
