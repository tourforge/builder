from rest_framework import viewsets, permissions, renderers
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ViewSet
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.http import FileResponse

from knox.auth import TokenAuthentication
from knox.views import LoginView as KnoxLoginView

from .models import *
from .serializers import *
from .permissions import *

User = get_user_model()

class LoginView(KnoxLoginView):
    authentication_classes = [BasicAuthentication]

class ProjectViewSet(ModelViewSet):
    serializer_class = ProjectSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated & ProjectPermission]

    def get_queryset(self):
        return Project.objects.filter(projectmember__user=self.request.user)

    def perform_create(self, serializer):
        project = serializer.save()
        ProjectMember.objects.create(user=self.request.user, project=project, admin=True)

class TourViewSet(ModelViewSet):
    serializer_class = TourSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated & TourPermission]

    def get_queryset(self):
        return Tour.objects.filter(project=self.kwargs['project_pk'])
    
    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_pk'])

class ProjectMemberViewSet(ModelViewSet):
    serializer_class = ProjectMemberSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated & ProjectMemberPermission]

    def get_queryset(self):
        return ProjectMember.objects.filter(
            project=self.kwargs['project_pk'],
            project__projectmember__user=self.request.user,
        )
    
    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_pk'])

class AssetViewSet(ModelViewSet):
    serializer_class = AssetSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [(permissions.IsAuthenticated & AssetPermission) | AssetDownloadPermission]

    def get_queryset(self):
        if self.action == "download":
            return Asset.objects.all()
        else:
            return Asset.objects.filter(
                project=self.kwargs['project_pk'],
                project__id=self.kwargs['project_pk'],
                project__projectmember__user=self.request.user,
            )
    
    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_pk'])

    @action(methods=['get'], detail=True)
    def download(self, *args, **kwargs):
        instance: Asset = self.get_object()
        file_handle = instance.file.open()
        match instance.file.name.lower().rsplit(".", maxsplit=1):
            case [_, 'png']:
                content_type = 'image/png'
            case [_, 'jpg' | 'jpeg']:
                content_type = 'image/jpeg'
            case [_, 'mp3']:
                content_type = 'audio/mpeg'
            case _:
                content_type = ''
        response = FileResponse(file_handle, content_type=content_type)
        response['Content-Length'] = instance.file.size
        response['Content-Disposition'] = 'attachment; filename="%s"' % instance.file.name

        return response

class UserViewSet(viewsets.mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [TokenAuthentication]
