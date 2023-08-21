from django.contrib import admin
from otb_server.models import Project

class ProjectAdmin(admin.ModelAdmin):
    pass


admin.site.register(Project, ProjectAdmin)