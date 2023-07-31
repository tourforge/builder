from .models import *
from .serializers import *
from .permissions import *
from rest_framework import viewsets, permissions

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    #permission_classes = [permissions.IsAuthenticated & IsProjectMember]

class TourViewSet(viewsets.ModelViewSet):
    queryset = Tour.objects.all()
    serializer_class = TourSerializer
    #permission_classes = [permissions.IsAuthenticated & IsProjectMember]

class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    #permission_classes = [permissions.IsAuthenticated]