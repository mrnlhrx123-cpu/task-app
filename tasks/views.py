from django.shortcuts import render
from rest_framework import viewsets
from .models import Task
from .serializers import TaskSerializer
from django.contrib.auth.decorators import login_required

# 1. الـ View ديال الـ API (محمي بالـ login)
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        # تصفية المهام ليعود لكل مستخدم مهامه فقط
        if self.request.user.is_authenticated:
            return Task.objects.filter(user=self.request.user).order_by('-id')
        return Task.objects.none()

    def perform_create(self, serializer):
        # ربط المهمة أوتوماتيكياً بالمستخدم الحالي
        serializer.save(user=self.request.user)

# 2. الـ View ديال الصفحة الرئيسية
@login_required(login_url='/login/')
def home_view(request):
    return render(request, 'index.html')

# 3. الـ View ديال البروفايل
@login_required
def profile(request):
    return render(request, 'profile.html')