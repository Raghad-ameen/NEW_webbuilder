"""
URL configuration for website_builder project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
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
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from builder_api.views import live_site_view

urlpatterns = [
    # Built-in django admin
    path('django-admin/', admin.site.urls),
    
    # Platform APIs
    path('api/', include('builder_api.urls')),
    
    # Live websites
    path('live/<str:subdomain>/', live_site_view, name='live_site_home'),
    path('live/<str:subdomain>/<str:page_slug>/', live_site_view, name='live_site_page'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

