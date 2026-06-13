from django.apps import AppConfig


from django.apps import AppConfig
from django.db.models.signals import post_migrate

class TasksConfig(AppConfig):
    name = 'tasks'
class YourAppConfig(AppConfig):
    name = 'your_app_name'

    def ready(self):
        post_migrate.connect(create_superuser, sender=self)

def create_superuser(sender, **kwargs):
    from django.contrib.auth.models import User
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'password123')