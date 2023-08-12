from django.contrib.auth.models import User
from rest_framework import relations
from rest_framework.serializers import HyperlinkedModelSerializer, HyperlinkedRelatedField, CharField
from rest_framework_nested.serializers import NestedHyperlinkedModelSerializer
from rest_framework_nested.relations import NestedHyperlinkedRelatedField

from .models import Project, Tour, ProjectMember

class ProjectSerializer(HyperlinkedModelSerializer):
    tours = relations.HyperlinkedIdentityField(view_name='tour-list', lookup_url_kwarg='project_pk')
    members = relations.HyperlinkedIdentityField(view_name='projectmember-list', lookup_url_kwarg='project_pk')

    class Meta:
        model = Project
        fields = '__all__'

class TourSerializer(NestedHyperlinkedModelSerializer):
    parent_lookup_kwargs = {
        'project_pk': 'project__pk',
    }

    project = NestedHyperlinkedRelatedField(read_only=True, view_name='project-detail', parent_lookup_kwargs=parent_lookup_kwargs)

    class Meta:
        model = Tour
        fields = '__all__'

class ProjectMemberSerializer(NestedHyperlinkedModelSerializer):
    parent_lookup_kwargs = {
        'project_pk': 'project__pk',
    }

    project = NestedHyperlinkedRelatedField(read_only=True, view_name='project-detail', parent_lookup_kwargs=parent_lookup_kwargs)
    user = HyperlinkedRelatedField(queryset=User.objects.all(), view_name='user-detail')
    username = CharField(read_only=True, source='user.username')

    class Meta:
        model = ProjectMember
        fields = '__all__'

class UserSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'id', 'username')
