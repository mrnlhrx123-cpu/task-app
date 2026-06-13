from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from tasks import views as task_views # هنا كنسميوها task_views

urlpatterns = [
    path('admin/', admin.site.urls),
    # هنا كنخدمو بـ task_views
    path('', task_views.home_view, name='home'), 
    path('api/', include('tasks.urls')), 
    path('api-auth/', include('rest_framework.urls')), 
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    # وتأكدي أن الـ profile حتى هي كتستعمل task_views.profile
    path('accounts/profile/', task_views.profile, name='profile')
]