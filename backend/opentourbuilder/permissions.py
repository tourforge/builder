
from rest_framework import permissions

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser

class IsAdminProjectMember(permissions.BasePermission):
    def has_permission(self, request, view):
        # Simplified. You'd actually need to look at the ProjectMember 
        # instance for the current project and check its 'admin' field.
        return request.user.is_admin

class IsProjectMember(permissions.BasePermission):
    def has_permission(self, request, view):
        # Simplified. You'd actually need to check if the user is a member 
        # of the project they're trying to access.
        return request.user.is_project_member