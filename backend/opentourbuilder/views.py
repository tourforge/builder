from .models import *
from .serializers import *
from .permissions import *
from rest_framework import viewsets, permissions, views
from rest_framework.response import Response

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated & IsProjectMember]

    def get_queryset(self):
        return Project.objects.all().filter(projectmember__user = self.request.user)

    def perform_create(self, serializer):
        project = serializer.save()
        ProjectMember.objects.create(user=self.request.user, project=project, admin=True)

class TourViewSet(viewsets.ModelViewSet):
    queryset = Tour.objects.all()
    serializer_class = TourSerializer
    permission_classes = [permissions.IsAuthenticated & IsProjectMember]

class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserViewSet(viewsets.mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
