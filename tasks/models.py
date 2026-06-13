from django.db import models
from django.contrib.auth.models import User

class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    text = models.CharField(max_length=255)
    date = models.DateField()
    duration = models.IntegerField(default=30) # المدة بالدقائق
    elapsed_seconds = models.IntegerField(default=0) # المؤقت الفعلي بالثواني
    status = models.CharField(max_length=15, default='planned') # planned, completed, postponed
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    start_time = models.TimeField(blank=True, null=True)

    def __str__(self):
        return self.text
