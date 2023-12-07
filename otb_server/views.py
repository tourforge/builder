import json
import hashlib
import zipfile
import tempfile
import shutil

from rest_framework import viewsets, permissions, renderers, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ViewSet
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.http import FileResponse, HttpResponseBadRequest, FileResponse
from django.db.models import Q

from knox.auth import TokenAuthentication
from knox.views import LoginView as KnoxLoginView

import routingpy
import polyline

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

    @action(methods=['get'], detail=True)
    def export(self, *args, **kwargs):
        project = self.get_object()
        tours = Tour.objects.filter(project=project)
        required_assets = {}

        def visit_asset(asset_id):
            asset = Asset.objects.filter(id=asset_id).first()
            if asset is None:
                return None

            split = asset.file.name.split(".", maxsplit=1)
            if len(split) == 2:
                ext = f".{split[1]}"
            else:
                ext = ""
            new_filename = f"assets/{asset.hash}{ext}"
            required_assets[new_filename] = asset
            return new_filename

        def visit_assets(asset_ids):
            return list(filter(lambda it: it is not None, map(visit_asset, asset_ids)))

        temp_fd, temp_path = tempfile.mkstemp()
        with zipfile.ZipFile(open(temp_fd, mode="wb"), mode="w") as zf:
            tours_content = []
            for tour in tours:
                tour: Tour = tour
                content = {**tour.content, "title": tour.title}
                tours_content.append(content)

                if "gallery" in content:
                    content["gallery"] = visit_assets(content["gallery"])
                if "tiles" in content:
                    content["tiles"] = visit_asset(content["tiles"])
                if "waypoints" in content:
                    for waypoint in content["waypoints"]:
                        if "gallery" in waypoint:
                            waypoint["gallery"] = visit_assets(waypoint["gallery"])
                        if "narration" in waypoint:
                            waypoint["narration"] = visit_asset(waypoint["narration"])
                if "pois" in content:
                    for poi in content["pois"]:
                        if "gallery" in poi:
                            poi["gallery"] = visit_assets(waypoint["gallery"])

                content_str = json.dumps(content)
                h = hashlib.sha256()
                h.update(bytes(content_str, "UTF-8"))
                content_hash = h.hexdigest()
                content_filename = f"{content_hash}.json"
                zf.writestr(content_filename, content_str)

            index = {
                "tours": [{
                    "title": tour["title"] if "title" in tour else None,
                    "thumbnail": next(iter(tour["gallery"]), None),
                    "type": tour["type"] if "type" in tour else None,
                } for tour in tours_content],
            }
            index_str = json.dumps(index)
            zf.writestr("index.json", index_str)

            for filename, asset in required_assets.items():
                filename: str = filename
                asset: Asset = asset
                with zf.open(filename, "w") as asset_file:
                    shutil.copyfileobj(asset.file, asset_file)

        # zipfile closes the zip, so now we have to reopen the temp path
        return FileResponse(open(temp_path, mode="rb"), as_attachment=True, filename="export.zip", content_type="application/zip")

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
            results = Asset.objects.filter(
                project=self.kwargs['project_pk'],
                project__id=self.kwargs['project_pk'],
                project__projectmember__user=self.request.user,
            )

            if self.request.GET.get('type') == "image":
                return results.filter(Q(file__endswith=".png") | Q(file__endswith=".jpg") | Q(file__endswith=".jpeg"))
            elif self.request.GET.get('type') == "audio":
                return results.filter(Q(file__endswith=".mp3"))
            else:
                return results

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project_id=self.kwargs['project_pk'], hash=self.calc_hash(serializer.validated_data["file"]))
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(hash=self.calc_hash(serializer.validated_data["file"]))

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def calc_hash(self, file):
        try:
            h = hashlib.sha256()
            for chunk in file.chunks():
                h.update(chunk)
            return h.hexdigest()
        except e:
            print("ERROR: failed to calculate file hash:", e)
            return ""

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

        return response

class UserViewSet(viewsets.mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [TokenAuthentication]

class RouteView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    _client = routingpy.routers.Valhalla()

    def post(self, request: Request):
        locations = []

        req_json = json.loads(request.body)
        if type(req_json) is list:
            for loc in req_json:
                if type(loc) is list and len(loc) == 2:
                    if type(loc[0]) is float and type(loc[1]) is float:
                        locations.append([loc[1], loc[0]])
                    else:
                        return HttpResponseBadRequest()
                else:
                    return HttpResponseBadRequest()
        else:
            return HttpResponseBadRequest()

        route = self._client.directions(locations=locations, profile="auto")
        
        response = {
            "path": polyline.encode(route.geometry, geojson=True)
        }

        return Response(data=response, content_type="application/json")
