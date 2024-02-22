import time

from django.core import signing
from django.contrib.auth.models import User
from rest_framework.permissions import BasePermission

from .models import Project, ProjectMember

def _is_project_member(user: User, project):
    return ProjectMember.objects.filter(user=user, project=project).exists()

def _is_admin_project_member(user: User, project: Project):
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

class AssetPermission(BasePermission):
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

class AssetDownloadPermission(BasePermission):
    _signer = signing.Signer(sep="&signature=")

    def has_permission(self, request, view):
        if view.action == 'download':
            uri = request.build_absolute_uri()
            unsigned = self._signer.unsign(uri)
            split = unsigned.rsplit("expiry=", maxsplit=1)

            if len(split) != 2:
                return False

            try:
                expiry = signing.b62_decode(split[1])
            except ValueError:
                # fail to decode
                return False

            return time.time() < float(expiry)
        else:
            return False

