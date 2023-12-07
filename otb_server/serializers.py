import time
import re

from django.core import signing
from rest_framework import relations
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from .models import Project, Tour, ProjectMember, User, Asset

class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class TourSerializer(ModelSerializer):
    class Meta:
        model = Tour
        fields = '__all__'

class ProjectMemberSerializer(ModelSerializer):
    username = serializers.CharField(read_only=True, source='user.username')

    class Meta:
        model = ProjectMember
        fields = '__all__'

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

    class Meta:
        model = Asset
        fields = '__all__'

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')
