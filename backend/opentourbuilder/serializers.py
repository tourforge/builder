from rest_framework import relations
from rest_framework.serializers import ModelSerializer, HyperlinkedRelatedField, CharField

from .models import Project, Tour, ProjectMember, User

class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class TourSerializer(ModelSerializer):
    class Meta:
        model = Tour
        fields = '__all__'

class ProjectMemberSerializer(ModelSerializer):
    username = CharField(read_only=True, source='user.username')

    class Meta:
        model = ProjectMember
        fields = '__all__'

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')
