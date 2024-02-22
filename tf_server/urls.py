"""
URL configuration for tf_server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_nested import routers
import knox.views as knox_views
from .views import *

router = routers.SimpleRouter(trailing_slash=False)
router.register(r'users', UserViewSet)
router.register(r'projects', ProjectViewSet, basename='project')

projects_router = routers.NestedSimpleRouter(router, r'projects', lookup='project', trailing_slash=False)
projects_router.register(r'tours', TourViewSet, basename='tour')
projects_router.register(r'members', ProjectMemberViewSet, basename='projectmember')
projects_router.register(r'assets', AssetViewSet, basename='asset')

urlpatterns = [
    re_path(r'^download/(?P<project_id>[^/]+)/(?P<file_path>.+)$', download_project_file, name='download_project_file'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include(projects_router.urls)),
    path('api/route', RouteView.as_view(), name='route'),
    path('api/login', LoginView.as_view(), name='knox_login'),
    path('api/logout', knox_views.LogoutView.as_view(), name='knox_logout'),
    path('api/logoutall', knox_views.LogoutAllView.as_view(), name='knox_logoutall'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + [
    # Catch-all routes for the Solid frontend
    path('', catchall_view),
    re_path(r'^(?P<path>.*)/$', catchall_view),
]
