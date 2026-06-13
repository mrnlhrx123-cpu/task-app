from django.shortcuts import render
from rest_framework import viewsets
from .models import Task
from .serializers import TaskSerializer
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.shortcuts import render

# 1. الـ View المسؤول عن عرض صفحة الـ HTML (Dashboard)
def home_view(request):
    return render(request, 'index.html')

# 2. الـ ViewSet المسؤول عن الـ API الخاص بالمهام
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        # تصفية المهام ليعود لكل مستخدم مهامه فقط
        return Task.objects.filter(user=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        # ربط المهمة أوتوماتيكياً بالمستخدم الحالي
        serializer.save(user=self.request.user)
@login_required(login_url='/login/') 
def home_view(request):
    return render(request, 'index.html')        

@login_required # هادي كتحمي الصفحة، يعني غير اللي مسجل يقدر يدخل
def profile(request):
    return render(request, 'profile.html') # خاصك تصاوبي هاد الملف فالـ templates
def profile(request):
    return render(request, 'profile.html')