
from rest_framework import permissions
from .models import Project, ProjectMember

class IsAdminProjectMember(permissions.BasePermission):
    def has_object_permission(self, request, _, obj):
        return type(obj) is not Project or ProjectMember.objects.filter(user=request.user, project=obj, admin=True).exists()

class IsProjectMember(permissions.BasePermission):
    def has_object_permission(self, request, _, obj):
        return type(obj) is not Project or ProjectMember.objects.filter(user=request.user, project=obj, admin=True).exists()
