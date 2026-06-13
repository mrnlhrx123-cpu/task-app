"""
URL configuration for core project.

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
from tasks.views import home_view # 👈 استيراد الـ View الجديدة
from django.contrib.auth import views as auth_views
from tasks import views as task_views # 👈 تأكد من هاد الـ import

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'), # 👈 1. الرابط الرئيسي الفاضي دابا غايعرض الـ HTML ديالنا
    path('api/', include('tasks.urls')), 
    path('api-auth/', include('rest_framework.urls')), 
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('', task_views.home_view, name='home'),
]