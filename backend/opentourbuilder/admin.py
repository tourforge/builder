from django.contrib import admin
from opentourbuilder.models import Project

class ProjectAdmin(admin.ModelAdmin):
    pass


admin.site.register(Project, ProjectAdmin)