from django.apps import AppConfig
from django.db.models.signals import post_migrate

# Function to create superuser
def create_superuser(sender, **kwargs):
    from django.contrib.auth.models import User
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'password123')

class TasksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tasks'

    def ready(self):
        post_migrate.connect(create_superuser, sender=self)