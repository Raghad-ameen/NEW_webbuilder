import os
import sys
import django

def seed_data():
    # Append backend to path so we can import settings
    sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'website_builder.settings')
    
    django.setup()
    from django.contrib.auth.models import User
    
    print("Seeding initial users...")
    
    # Create admin
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'password123')
        print("Admin user created successfully! (Username: admin, Password: password123)")
    else:
        print("Admin user already exists.")
        
    # Create regular user
    if not User.objects.filter(username='user').exists():
        User.objects.create_user('user', 'user@example.com', 'password123')
        print("Regular user created successfully! (Username: user, Password: password123)")
    else:
        print("Regular user already exists.")

if __name__ == "__main__":
    seed_data()
