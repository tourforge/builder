from django.contrib.auth.models import User
from rest_framework.permissions import BasePermission

from .models import Project, ProjectMember

def _is_project_member(user: User, project):
    return ProjectMember.objects.filter(user=user, project=project).exists()

def _is_admin_project_member(user: User, project: Project):
    print(ProjectMember.objects.filter(user=user, project=project, admin=True))
    return ProjectMember.objects.filter(user=user, project=project, admin=True).exists()

class ProjectPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        match view.action:
            case 'retrieve':
                return _is_project_member(request.user, obj)
            case 'update' | 'partial_update' | 'destroy':
                return _is_admin_project_member(request.user, obj)
            case _:
                return True

class TourPermission(BasePermission):
    def has_permission(self, request, view):
        match view.action:
            case 'create':
                return _is_project_member(request.user, view.kwargs['project_pk'])
            case _:
                return True

    def has_object_permission(self, request, view, obj):
        match view.action:
            case 'retrieve' | 'update' | 'partial_update' | 'destroy':
                return _is_project_member(request.user, obj.project)
            case _:
                return True

class ProjectMemberPermission(BasePermission):
    def has_permission(self, request, view):
        match view.action:
            case 'create':
                return _is_admin_project_member(request.user, view.kwargs['project_pk'])
            case _:
                return True

    def has_object_permission(self, request, view, obj):
        match view.action:
            case 'retrieve':
                return _is_project_member(request.user, obj.project)
            case 'update' | 'partial_update' | 'destroy':
                return obj.user == request.user or _is_admin_project_member(request.user, obj.project)
            case _:
                return True
