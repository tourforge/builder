import time
import re
import os
from datetime import datetime

from django.core import signing
from django.conf import settings
from rest_framework import relations
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from .models import Project, Tour, ProjectMember, User, Asset

class ProjectSerializer(ModelSerializer):
    last_published = serializers.SerializerMethodField()

    class Meta:
        model = Project
        exclude = ['published_bundle']
    
    def get_last_published(self, project):
        if project.published_bundle:
            try:
                # Get the full path of the file
                file_path = os.path.join(settings.MEDIA_ROOT, project.published_bundle.name)
                # Get the modification time of the file
                mod_time = os.path.getmtime(file_path)
                return datetime.fromtimestamp(mod_time)
            except OSError:
                # Handle errors if file doesn't exist
                return None
        return None

class TourSerializer(ModelSerializer):
    class Meta:
        model = Tour
        fields = '__all__'
        read_only_fields = ('project',)

class ProjectMemberSerializer(ModelSerializer):
    username = serializers.CharField(read_only=True, source='user.username')

    class Meta:
        model = ProjectMember
        fields = '__all__'
        read_only_fields = ('project',)

_NAME_REGEX = re.compile(r"(.+)/(.+)(\..+)?")
class _SignedFileField(serializers.FileField):
    _signer = signing.Signer(sep="&signature=")

    def get_attribute(self, instance: Asset):
        return instance

    def to_representation(self, instance: Asset):
        request = self.context.get('request', None)
        if request is None:
            return None
        url = request.build_absolute_uri(f"/api/projects/{instance.project.id}/assets/{instance.id}/download")

        expiry = time.time() + 600
        url += f"?expiry={signing.b62_encode(int(expiry))}"

        return self._signer.sign(url)

class AssetSerializer(ModelSerializer):
    file = _SignedFileField()
    hash = serializers.CharField(read_only=True)
    type = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = '__all__'
    
    def get_type(self, asset):
        split = asset.file.path.split(".")
        match split:
            case [*_, "png" | "jpg" | "jpeg"]:
                return "image"
            case [*_, "mp3"]:
                return "audio"
            case _:
                return None

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')
