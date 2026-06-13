from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
      model = Task
      fields = ['id', 'user', 'text', 'date', 'duration', 'elapsed_seconds', 'status']